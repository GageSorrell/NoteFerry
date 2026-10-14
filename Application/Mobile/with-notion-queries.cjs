const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withNotionQueries(config)
{
    return withAndroidManifest(config, (Config) =>
    {
        const Manifest = Config.modResults.manifest;
        const Queries = Manifest.queries ?? [];
        const HasNotionQuery = Queries.some((Query) =>
            Query.intent?.some((Intent) =>
                Intent.data?.some((Data) => Data.$?.["android:scheme"] === "notion")
            )
        );

        if (!HasNotionQuery)
        {
            Queries.push({
                intent: [
                    {
                        action: [ { $: { "android:name": "android.intent.action.VIEW" } } ],
                        category: [
                            { $: { "android:name": "android.intent.category.DEFAULT" } },
                            { $: { "android:name": "android.intent.category.BROWSABLE" } }
                        ],
                        data: [ { $: { "android:scheme": "notion" } } ]
                    }
                ]
            });
        }

        Manifest.queries = Queries;
        return Config;
    });
};
