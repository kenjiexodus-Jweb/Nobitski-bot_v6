module.exports = {
    name: "id",
    usePrefix: false,
    usage: "id [@mention]",
    version: "1.1",
    description: "Fetch the Facebook UID of a user or yourself.",
    admin: false,
    cooldown: 10,

    execute: async ({ api, event }) => {
        const { threadID, messageID, senderID, mentions } = event;

        let uid;
        let userName;

        if (Object.keys(mentions).length > 0) {
            uid = Object.keys(mentions)[0];
            userName = mentions[uid].replace("@", "");
        } else {
            uid = senderID;
            userName = "You";
        }

        const msg = `👤 ${userName}\n📋 UID:\n${uid}`;
        api.sendMessage(msg, threadID, messageID);
    }
};
