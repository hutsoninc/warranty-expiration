const sanityClient = require('@sanity/client');

const client = sanityClient({
    projectId: 'sw3vm7m7',
    dataset: 'production',
    apiVersion: '1',
    token: process.env.SANITY_SOURCE_TOKEN,
});

const fetchLobAddresses = (helpers, options = {}, addresses = []) => {
    const { Lob } = helpers;
    return new Promise((resolve, reject) => {
        Lob.addresses.list({ limit: 100, ...options }, (err, res) => {
            if (err) {
                reject(err);
            }
            addresses = addresses.concat(res.data);
            if (res.next_url) {
                const { searchParams } = new URL(res.next_url);
                fetchLobAddresses(
                    helpers,
                    { after: searchParams.get('after') },
                    addresses
                )
                    .then((res) => {
                        resolve(res);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                resolve(addresses);
            }
        });
    });
};

const createLobAddress = (helpers, data) => {
    const { Lob } = helpers;
    return new Promise((resolve, reject) => {
        Lob.addresses.create(data, (err, res) => {
            if (err) {
                reject(err);
            }
            resolve(res);
        });
    });
};

const fetchHutsonLocations = async (helpers) => {
    // Fetch Hutson addresses from Lob
    const lobHutsonAddresses = await fetchLobAddresses(helpers)
        .then((res) =>
            res.filter((obj) => obj.company.toUpperCase() === 'HUTSON INC')
        )
        .catch((err) => {
            console.error(
                'There was a problem fetching addresses from Lob: ',
                err
            );
            process.exit(1);
        });
    // Fetch Hutson locations from Sanity
    const sanityHutsonLocations = await client
        .fetch(
            '*[_type == "location" && retailLocation == true]{title, address, city, state, zip, phoneNumber, agDealerId, cceDealerId, turfDealerId}'
        )
        .then((locations) => {
            if (locations.length === 0) {
                throw new Error('No locations were returned.');
            }
            return locations;
        })
        .catch((err) => {
            console.error(
                'There was a problem fetching Hutson location data from Santiy: ',
                err
            );
            process.exit(1);
        });
    // Merge and create new Lob addresses if needed
    const hutsonLocations = await Promise.all(
        sanityHutsonLocations.map((loc) => {
            return new Promise((resolve, reject) => {
                const match = lobHutsonAddresses.find((addr) => {
                    return (
                        String(addr.address_zip).slice(0, 5) ===
                        String(loc.zip).slice(0, 5)
                    );
                });
                if (!match) {
                    // Create new Lob address
                    createLobAddress(helpers, {
                        company: 'Hutson Inc',
                        phone: loc.phoneNumber.replace(/\D/g, ''),
                        address_line1: loc.address,
                        address_city: loc.city,
                        address_state: loc.state,
                        address_zip: loc.zip,
                        address_country: 'US',
                    })
                        .then((res) => {
                            resolve({ ...loc, lobAddressId: res.id });
                        })
                        .catch((err) => {
                            reject(
                                'Failed to create a new Lob address for location: ',
                                loc.title
                            );
                        });
                } else {
                    resolve({ ...loc, lobAddressId: match.id });
                }
            });
        })
    );
    return hutsonLocations;
};

module.exports = fetchHutsonLocations;
