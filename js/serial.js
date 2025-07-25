class SerialPortHandler {
    constructor(options, onConnect, onDisconnect, readTimeOut = 1000) {
        this.onConnect = onConnect
        this.onDisconnect = onDisconnect
        this.options = options
        this.readTimeOut = readTimeOut
        this.port = null
        this.isOpened = false
        this.error = null

        this.#setupListeners()
    }

    async open() {
        if ("serial" in navigator) {
            // The Web Serial API is supported.
            // Prompt user to select any serial port 
            try {
                const port = await navigator.serial.requestPort()
                await port.open(this.options)

                this.port = port
                this.isOpened = true

                return this.port.getInfo()
            } 
            catch (error) {
                this.error = error                
                throw error
            }
        }
        else {
            this.error =
                "Ваш браузер не поддерживает Web Serial API, " +
                "рекомендуем использовать Google Chrome " +
                "версия 89 (или более позднюю)"
        }
    }

    async close() {
        await this.port.close()
        this.isOpened = false
    }

    async write(data) {
        const writer = this.port.writable.getWriter()
        try {
            await writer.write(data)
        }
        catch (error) {
            this.error = error
            throw error
        } finally {
            writer.releaseLock()
        }
    }

    async read(checkEndOfTransmission) {

        this.error = null
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout exceeded')), this.readTimeOut)
        })

        while (this.port.readable) {
            const reader = this.port.readable.getReader()
            let chunks = new Uint8Array([])

            try {
                while (true) {

                    const { value, done } = await Promise.race([
                        reader.read(),
                        timeoutPromise
                    ])


                    chunks = Uint8Array.from([...chunks, ...value])

                    /* DEBUG: received chunks in hex
                    const hexString = [...chunks]
                        .map(byte => byte.toString(16).padStart(2, '0'))
                        .join(' ')
                    console.log(hexString)
                    */

                    if (done || checkEndOfTransmission(chunks)) {
                        reader.releaseLock()
                        break
                    }
                }
                return chunks
            } catch (error) {
                this.error = error
                throw error
            } finally {
                reader.releaseLock()
            }
        }
    }

    async transAct(data, checkEndOfTransmission) {
        await this.write(data)
        return await this.read(checkEndOfTransmission)
    }

    #setupListeners() {
        if ("serial" in navigator) {
            navigator.serial.addEventListener('connect', this.onConnect)
            navigator.serial.addEventListener('disconnect', this.onDisconnect)
        }
    }
}