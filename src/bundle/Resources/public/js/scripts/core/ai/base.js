import { getJsonFromResponse, getRequestMode } from '../../helpers/request.helper';
import { getTranslator } from '../../helpers/context.helper';
export default class Base {
    constructor({ endpointURL }) {
        this.endpointURL = endpointURL;

        this.Translator = getTranslator();

        this.fetchData = this.fetchData.bind(this);
    }

    disableInputs() {}

    enableInputs() {}

    fetchData(args) {
        const body = JSON.stringify(this.getRequestBody(args));

        // TODO: modify request
        const request = new Request(this.endpointURL, {
            method: 'GET',
            headers: {
                Accept: 'application/vnd.ibexa.api.View+json; version=1.1',
                'Content-Type': 'application/vnd.ibexa.api.ViewInput+json; version=1.1',
            },
            // body,
            mode: getRequestMode({ instanceUrl: this.endpointURL }),
        });

        this.disableInputs();

        return new Promise((resolve) => {
            setTimeout(() => {
                fetch(request).then(getJsonFromResponse).then(resolve);
            }, 100);
        }).then((response) => {
            this.enableInputs();
            this.processOutput(response);
        });
    }

    getRequestBody() {}

    getInput() {}

    init() {}

    processOutput() {}
}
