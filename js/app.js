class Application {
    constructor(root) {

        this.serialPort = null
        this.uap = null
        this.addressIsValid = false

        /**
         * DOM Elements
         */
        this.$root = root
        this.$openPortButton = this.$root.querySelector('#openPort')
        this.$address = this.$root.querySelector('#address')
        this.$writeAddressButton = this.$root.querySelector('#writeAddress')
        this.$statusIndicator = this.$root.querySelector('#statusIndicator')
        this.$statusText = this.$root.querySelector('#statusText')

        this.$writeAddressButton.setAttribute('disabled', 'true')

        this.#setupEvents()
    }

    #setupEvents() {
        this.$writeAddressButton.addEventListener('click', this.#writeAddressHandler.bind(this))
        this.$openPortButton.addEventListener('click', this.#openPortHandler.bind(this))
        this.$address.addEventListener('change', this.#addressHandler.bind(this))
    }

    async #writeAddressHandler() {
        this.$openPortButton.setAttribute('disabled', 'true')
        this.$writeAddressButton.setAttribute('disabled', 'true')
        this.$address.setAttribute('disabled', 'true')
        this.#updateStatus('Запись адреса ' + this.$address.value + ' ...', false)

        try {
            await this.uap.writeAddress()
        }
        catch (error){
            throw error
        }
        finally {
            if (this.serialPort.error == null) {
                this.#updateStatus('Адрес ' + this.$address.value + ' успешно записан', true)
            }
            else {
                this.#updateStatus('Произошла ошибка: ' + this.serialPort.error, false, true)
            }
            this.$writeAddressButton.removeAttribute("disabled")
            this.$openPortButton.removeAttribute("disabled")
            this.$address.removeAttribute("disabled")
        }
    }

    async #openPortHandler() {
        if (!this.serialPort) {
            this.serialPort = new SerialPortHandler(
                { baudRate: serialSettings.baudRate }, // options
                checkEndOfTransmission, // checkEndOfTransmission
                () => this.#connectHandler(), // connectHandler
                () => this.#disconnectHandler() // disconnectHandler
            )
        }


        this.serialPort.open()
        if (!this.serialPort.error) {
            this.#updateStatus("Порт подключен", true)
            if (this.addrssIsValid) this.$writeAddressButton.removeAttribute("disabled")

            if (!this.uap) this.uap = new UAP(this.serialPort)
            else this.uap.setPort(this.serialPort)
        }
        else this.#updateStatus(this.serialPort.error, false, true)

    }

    async #addressHandler(e) {
        this.addrssIsValid = e.target.checkValidity()

        if (this.addrssIsValid && this.serialPort && this.serialPort.isOpened)
            this.$writeAddressButton.removeAttribute("disabled")
        else
            this.$writeAddressButton.setAttribute('disabled', 'true')
    }

    #updateStatus(text, isActive, isError = false) {
        this.$statusText.textContent = text

        this.$statusIndicator.className = 'status-indicator'
        if (isError) {
            this.$statusIndicator.classList.add('error')
        } else if (isActive) {
            this.$statusIndicator.classList.add('active')
        }
    }


    async #connectHandler() {
    }

    async #disconnectHandler() {
        if (!this.serialPort.isOpened) return
        await this.serialPort.close()
        this.#updateStatus('Порт не выбран', false, false)

        this.$writeAddressButton.setAttribute('disabled', 'true')
    }


}


new Application(document.getElementById('app'))