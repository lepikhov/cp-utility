/*
UAP protocol implementation 
*/

/**
 * Checks for the presence of the end-of-transmission sequence (0x7E, 0xF0) in a UInt8Array.
 * @param {UInt8Array} data - The array of bytes to search in.
 * @returns {number|null} The index of the first occurrence of the sequence or null if not found.
 */
 function checkEndOfTransmission(data) {
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i] === 0x7E && data[i + 1] === 0xF0) {
      return i
    }
  }
  return null
}

class UAP {
  constructor(port) {
    this.port = port
  }

  setPort(port) {
    this.port = port
  }


  async writeAddress() {
    const data = new Uint8Array([0x7E, 0x0F, 0x00, 0xFE, 0x80, 0x01, 0x01, 0x25, 0x5D, 0x7E, 0xF0]) // identification
    await this.port.transAct(data)
  }


}