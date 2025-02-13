$(document).ready(async () => {
    $('select').formSelect()

})

async function start() {
    if ("serial" in navigator) {
        // The Web Serial API is supported.
        // Prompt user to select any serial port
        try {
            port=await navigator.serial.requestPort()
        }
        catch {
            alert("Вы не выбрали последовательный порт")
        }

    }
    else {
        alert("Ваш браузер не поддерживает Web Serial API, " +
                "рекомендуем использовать Google Chrome " + 
                "версия 89 (или более позднюю)")
    }
}






