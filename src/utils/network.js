const os = require('os');

/**
 * Discovers available non-internal IPv4 network addresses on the local host.
 * Prioritizes active Wi-Fi and Ethernet interfaces.
 * 
 * @returns {Array<{ name: string, address: string }>}
 */
function getLocalNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal && !addr.address.startsWith('169.254')) {
        addresses.push({
          name,
          address: addr.address
        });
      }
    }
  }

  // Sort Wi-Fi and Ethernet to the front if found
  addresses.sort((a, b) => {
    const isAPriority = /wi-?fi|eth|lan/i.test(a.name);
    const isBPriority = /wi-?fi|eth|lan/i.test(b.name);
    if (isAPriority && !isBPriority) return -1;
    if (!isAPriority && isBPriority) return 1;
    return a.name.localeCompare(b.name);
  });

  return addresses;
}

/**
 * Returns the primary local IP address, or '127.0.0.1' fallback.
 * @returns {string}
 */
function getPrimaryLocalIp() {
  const addrs = getLocalNetworkAddresses();
  return addrs.length > 0 ? addrs[0].address : '127.0.0.1';
}

module.exports = {
  getLocalNetworkAddresses,
  getPrimaryLocalIp
};
