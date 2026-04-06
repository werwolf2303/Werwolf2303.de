import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

export default async(context) => {
    const { DataModel } = await context.require("data/DataBinding.mjs");
    const { getHttpClient } = await context.require("Requests.mjs");

    return {
        initController: async(controllerContext) => {
            const model = new DataModel({
                readme: ""
            });
            model.bindTo(controllerContext.view);

            const readmeRequest = await getHttpClient().execute(
                "https://raw.githubusercontent.com/werwolf2303/werwolf2303/refs/heads/main/README.md"
            );
            model.set("readme", marked.parse(await readmeRequest.text()));
        }
    }
}
