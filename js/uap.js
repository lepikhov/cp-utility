/*
UAP protocol implementation 
*/

// UAP constants
class UAPc {

  // protocol frame bytes
  static get BYTE_B() { return 0x7E }
  static get BYTE_H() { return 0x0F }
  static get BYTE_K() { return 0xF0 }


  // CRC-16 polynomial (e.g., CRC-16-CCITT: 0x1021)
  static get CRC_POLY() { return 0x1021 }

  // CRC-16 Init
  static get CRC_INIT() { return 0x0000 }

  // CRC-16 Init for config message
  static get CRC_INIT_FOR_CONFIG() { return 0xFFFF }

  // COMMANDS TYPES  
  static get COMMAND_IDENTIFICATION() { return 0x80 }
  static get COMMAND_RESET() { return 0x81 }
  static get COMMAND_DATA_REQUEST() { return 0xA0 }

  // COMMANDS IDS
  static get COMMAND_ID_INPUTS_STATE() { return 0x00 }
  static get COMMAND_ID_INPUTS_STATE_CHANGED() { return 0x01 }
  static get COMMAND_ID_INPUTS_STATE_BLINKING() { return 0x02 }
  static get COMMAND_ID_OUTPUTS_PRELIMINARY() { return 0x01 }
  static get COMMAND_ID_OUTPUTS_EXECUTIVE() { return 0x02 }
  static get COMMAND_ID_OUTPUTS_RESET() { return 0x03 }
  static get COMMAND_ID_OUTPUTS_COMMAND_STATUS() { return 0x04 }
  static get COMMAND_ID_OUTPUTS_SINGLE_EXECUTIVE() { return 0x05 }
  static get COMMAND_ID_OUTPUTS_SHORT_STATE() { return 0x11 }
  static get COMMAND_ID_OUTPUTS_EXTENDED_STATE() { return 0x12 }
  static get COMMAND_ID_COMPILATION_DATE() { return 0x21 }
  static get COMMAND_ID_DEVICE_NAME() { return 0x22 }
  static get COMMAND_ID_CHECKSUM() { return 0x23 }
  static get COMMAND_ID_STATISTIC() { return 0x31 }
  static get COMMAND_ID_WORK_TIME() { return 0x32 }
  static get COMMAND_ID_MAC() { return 0x41 }
  static get COMMAND_ID_READ_CONFIGURATION() { return 0x42 }
  static get COMMAND_ID_WRITE_CONFIGURATION() { return 0x43 }
  static get COMMAND_ID_READ_PARAMETERS() { return 0x44 }
  static get COMMAND_ID_WRITE_PARAMETERS() { return 0x45 }

  // ANSWER TICKETS
  static get TICKET_IDENTIFICATION() { return 0x00 }
  static get TICKET_DATA_SEND() { return 0x20 }
  static get TICKET_WRONG_COMMAND() { return 0x21 }
  static get TICKET_WRONG_PACKET_DATA() { return 0x22 }
  static get TICKET_RESET() { return 0x23 }

  // ANSWER TICKETS IDS
  static get TICKET_ID_DATA() { return 0x00 }
  static get TICKET_ID_INPUTS_STATE() { return 0x00 }
  static get TICKET_ID_INPUTS_STATE_CHANGED() { return 0x01 }
  static get TICKET_ID_INPUTS_STATE_BLINKING() { return 0x02 }
  static get TICKET_ID_OUTPUTS_PRELIMINARY() { return 0x01 }
  static get TICKET_ID_OUTPUTS_EXECUTIVE() { return 0x02 }
  static get TICKET_ID_OUTPUTS_RESET() { return 0x03 }
  static get TICKET_ID_OUTPUTS_COMMAND_STATUS() { return 0x04 }
  static get TICKET_ID_OUTPUTS_SINGLE_EXECUTIVE() { return 0x05 }
  static get TICKET_ID_OUTPUTS_SHORT_STATE() { return 0x11 }
  static get TICKET_ID_OUTPUTS_EXTENDED_STATE() { return 0x12 }
  static get TICKET_ID_COMPILATION_DATE() { return 0x21 }
  static get TICKET_ID_DEVICE_NAME() { return 0x22 }
  static get TICKET_ID_CHECKSUM() { return 0x23 }
  static get TICKET_ID_STATISTIC() { return 0x31 }
  static get TICKET_ID_WORK_TIME() { return 0x32 }
  static get TICKET_ID_MAC() { return 0x41 }
  static get TICKET_ID_READ_CONFIGURATION() { return 0x42 }
  static get TICKET_ID_WRITE_CONFIGURATION() { return 0x43 }
  static get TICKET_ID_READ_PARAMETERS() { return 0x44 }
  static get TICKET_ID_WRITE_PARAMETERS() { return 0x45 }

  // DEVICE IDENTIFIERS
  static get DEVICE_MANUFACTURE_ID() { return 0x37 }
  static get DEVICE_TYPE_KDS_ID() { return 0x10 }
  static get DEVICE_TYPE_BTU_ID() { return 0x80 }
  static get DEVICE_TYPE_UNKNOWN_ID() { return 0xFF }
}

class UAP {
  constructor(port) {
    this.port = port
  }


  setPort(port) {
    this.port = port
  }

  /**
 * Checks for the presence of the end-of-transmission sequence (0x7E, 0xF0) in a UInt8Array.
 * @param {UInt8Array} data - The array of bytes to search in.
 * @returns {number|null} The index of the first occurrence of the sequence or null if not found.
 */
  checkEndOfTransmission(data) {
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i] === UAPc.BYTE_B && data[i + 1] === UAPc.BYTE_K) {
        return i
      }
    }
    return null
  }


  /**
   * Calculates CRC-16 for a single data byte
   * @param {number} data - Input byte (0-255)
   * @param {number} crc - Current CRC value
   * @returns {number} - Updated CRC value
   */
  crc16Calc(data, crc) {
    crc ^= (data << 8)
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ UAPc.CRC_POLY) : (crc << 1)
    }
    return crc & 0xFFFF // Ensure 16-bit value
  }

  /**
  * Calculates CRC-16 for a data buffer and appends CRC at the end
  * @param {Uint8Array} buff - Input data buffer
  * @param {number} init - Initial CRC value
  * @returns {Uint8Array} - New buffer with appended CRC (original data + 2 CRC bytes)
  */
  crc16CalcBuff(buff, init) {
    let crc = init;
    for (let i = 0; i < buff.length; i++) {
      crc = this.crc16Calc(buff[i], crc)
    }

    // Create new buffer with extra 2 bytes for CRC
    const result = new Uint8Array(buff.length + 2)
    result.set(buff) // Copy original data

    // Append CRC (big-endian)
    result[buff.length] = (crc >> 8) & 0xFF    // High byte
    result[buff.length + 1] = crc & 0xFF       // Low byte

    return result
  }

  /**
   * Verifies the CRC-16 checksum of a buffer (including the CRC bytes at the end)
   * @param {Uint8Array} buff - Data buffer with appended CRC (last 2 bytes)
   * @param {number} init - Initial CRC value (same as used for calculation)
   * @returns {boolean} - True if CRC is valid, false otherwise
   */
  crc16CheckBuff(buff, init) {
    // Minimum buffer length should be 2 bytes (CRC only)
    if (buff.length < 2) return false

    // Calculate CRC for all bytes except the last 2 (CRC bytes)
    const dataLength = buff.length - 2
    let crc = init

    for (let i = 0; i < dataLength; i++) {
      crc = this.crc16Calc(buff[i], crc)
    }

    // Extract the stored CRC from the last 2 bytes (big-endian)
    const storedCRC = (buff[dataLength] << 8) | buff[dataLength + 1]

    // CRC is valid if the calculated value matches the stored one
    return (crc & 0xFFFF) === storedCRC
  }

  /** 
  * Message adaptatiom for UAP protocol:
  * 1. Add Start of Frame (BYTE_B, BYTE_H)  
  * 2. If the message contains the symbol BYTE_B, add an additional symbol BYTE_B before it
  * 3. Add End of Frame (BYTE_B, BYTE_K)
  * @param {Uint8Array} data - original message
  * @returns {Uint8Array} - extended message
  */
  prepareTxMessage(data) {
    let buf = new Array()

    buf.push(UAPc.BYTE_B)
    buf.push(UAPc.BYTE_H)

    for (let i = 0; i < data.length; ++i) {
      if (data[i] == this.BYTE_B) {
        buf.push(this.BYTE_B)
      }
      buf.push(data[i])
    }

    buf.push(UAPc.BYTE_B)
    buf.push(UAPc.BYTE_K)

    return new Uint8Array(buf)
  }

  getRxMessage(data) {
    let buf = new Array()
    let error = false
    let i

    for (i = 0; i < data.length - 1; i++) {
      if (data[i] === UAPc.BYTE_B && data[i + 1] === UAPc.BYTE_H) {
        break
      }
    }

    if (i > data.length - 2) {
      return { error: true, data: null }
    }

    i += 2

    for (; i < data.length - 2; i++) {
      if (data[i] == this.BYTE_B) {
        ++i
      }
      buf.push(data[i])
    }

    return { error: error, data: new Uint8Array(buf) }
  }

  // identification command
  async commandIdentification(recipientAddress, senderAddress) {

    this.error = null

    let data = new Uint8Array([
      recipientAddress, // recipient address (0x0 for broadcast)
      senderAddress, // sender address
      UAPc.COMMAND_IDENTIFICATION, // packet type
      0x01, // number of block
      0x01, // quantity of blocks
    ])

    try {
      data = await this.port.transAct(this.prepareTxMessage(this.crc16CalcBuff(data, UAPc.CRC_INIT)),
        this.checkEndOfTransmission)
    }
    catch (error) {
      this.error = 'Identification command->' + error
      throw Error(this.error)
    }

    let result = this.getRxMessage(data)

    if (result.error) {
      this.error = 'Identification command->Package'
      throw Error(this.error)
    }


    if (!this.crc16CheckBuff(result.data, UAPc.CRC_INIT)) {
      this.error = 'Identification command->CRC'
      throw Error(this.error)
    }

    if (result.data.length != 12) {
      this.error = 'Identification command->Package Length'
      throw Error(this.error)
    }

    return {
      manufacturer: result.data[5],
      type: result.data[6],
      version: result.data[7],
      maxPackageSize: result.data[8],
      maxWaitTime: result.data[9]
    }

  }

  // MAC command
  async commandMAC(recipientAddress, senderAddress) {

    this.error = null

    let data = new Uint8Array([
      recipientAddress, // recipient address (0x0 for broadcast)
      senderAddress, // sender address
      UAPc.COMMAND_DATA_REQUEST, // packet type
      0x01, // number of block
      0x01,  // quantity of blocks
      UAPc.COMMAND_ID_MAC, //
    ])

    try {
      data = await this.port.transAct(this.prepareTxMessage(this.crc16CalcBuff(data, UAPc.CRC_INIT)),
        this.checkEndOfTransmission)
    }
    catch (error) {
      this.error = 'MAC command->' + error
      throw Error(this.error)
    }

    let result = this.getRxMessage(data)

    if (result.error) {
      this.error = 'MAC command->Package'
      throw Error(this.error)
    }


    if (!this.crc16CheckBuff(result.data, UAPc.CRC_INIT)) {
      this.error = 'MAC command->CRC'
      throw Error(this.error)
    }

    if (result.data.length != 14) {
      this.error = 'MAC command->Package Length'
      throw Error(this.error)
    }

    return {
      MAC: result.data.subarray(6, 12)
    }

  }

  // Write Config command
  async commandWriteConfig(recipientAddress, senderAddress, MAC, config) {

    this.error = null

    let data = new Uint8Array([
      recipientAddress, // recipient address (0x0 for broadcast)
      senderAddress, // sender address
      UAPc.COMMAND_DATA_REQUEST, // packet type
      0x01, // number of block
      0x01,  // quantity of blocks
      UAPc.COMMAND_ID_WRITE_CONFIGURATION, //
    ])

    data = Uint8Array.from([...data, ...MAC, ...config])

    try {
      data = await this.port.transAct(this.prepareTxMessage(this.crc16CalcBuff(data, UAPc.CRC_INIT)),
        this.checkEndOfTransmission)
    }
    catch (error) {
      this.error = 'Write Config command->' + error
      throw Error(this.error)
    }

    let result = this.getRxMessage(data)

    if (result.error) {
      this.error = 'Write Config command->Package'
      throw Error(this.error)
    }


    if (!this.crc16CheckBuff(result.data, UAPc.CRC_INIT)) {
      this.error = 'Write Config command->CRC'
      throw Error(this.error)
    }

    if (result.data.length != 8) {
      this.error = 'Write Config command->Package Length'
      throw Error(this.error)
    }

  }

  async writeAddress(address) {

    let MAC
    let config = new Uint8Array(14)
    config[0] = address
    config = this.crc16CalcBuff(config, UAPc.CRC_INIT_FOR_CONFIG)

    this.error = null


    try {
      MAC = (await this.commandMAC(0x00, 0xFE)).MAC
    }
    catch (error) {
      this.error = 'UAP->' + error
      throw Error(this.error)
    }

    try {
      await this.commandWriteConfig(address, 0xFE, MAC, config)
    }
    catch (error) {
      this.error = 'UAP->' + error
      throw Error(this.error)
    }


  }


}