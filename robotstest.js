import robotsParser from 'robots-txt-parser';

async function isSiteRobotFriendly(url) {
    const {protocol, hostname} = new URL(url);
    const domain = protocol + '//' + hostname;

    const robotsToTest = [
        'Googlebot',
        'OAI-SearchBot',
        'ChatGPT-User',
        'GPTBot',
        'ReverseBrowser'
    ];

    for (const robot of robotsToTest) {
        const robotsParserInstance = robotsParser({
            userAgent: robot,
            allowOnNeutral: true
        });

        await robotsParserInstance.useRobotsFor(domain);
        if (!robotsParserInstance.canCrawlSync(url)) {
            console.log(robot + ' is not allowed to crawl the site.');
            return false;
        }
    }
    return true;
}

let url = "http://klickitatcounty.org/252/Listing-Comparable-Sales"
isSiteRobotFriendly(url).then((result) => {
    console.log(result);
});
