// cmds/bible.js
module.exports = {
  name: "bible",
  version: "1.2",
  description: "Magbigay ng random na Tagalog Bible verse.",
  usage: "bible",
  cooldown: 3,
  hasPermission: 0,
  usePrefix: false,
  credits: "Jonnel",

  async execute({ api, event }) {
    const verses = [
      "🕊️ Juan 3:16\n“Sapagkat gayon na lamang ang pag-ibig ng Diyos sa sanlibutan kaya’t ibinigay niya ang kanyang kaisa-isang Anak, upang ang sinumang sumampalataya sa kanya ay hindi mapahamak, kundi magkaroon ng buhay na walang hanggan.”",
      "🕊️ Filipos 4:13\n“Ang lahat ng bagay ay aking magagawa sa pamamagitan ni Cristo na nagpapalakas sa akin.”",
      "🕊️ Jeremias 29:11\n“Sapagkat nalalaman ko ang mga plano ko para sa inyo,’ sabi ng Panginoon. ‘Mga planong hindi upang saktan kayo kundi bigyan kayo ng pag-asa at magandang kinabukasan.”",
      "🕊️ Awit 23:1\n“Ang Panginoon ang aking pastol, hindi ako magkukulang.”",
      "🕊️ Kawikaan 3:5\n“Magtiwala ka sa Panginoon ng buong puso mo at huwag kang manalig sa iyong sariling kaalaman.”",
      "🕊️ Roma 8:28\n“Alam natin na sa lahat ng bagay, ang Diyos ay gumagawa para sa ikabubuti ng mga umiibig sa kanya.”",
      "🕊️ Isaias 41:10\n“Huwag kang matakot sapagkat ako'y kasama mo; huwag kang manglupaypay sapagkat ako ang iyong Diyos.”",
      "🕊️ Mateo 11:28\n“Lumapit kayo sa akin, kayong lahat na nahihirapan at nabibigatan sa pasanin, at kayo'y bibigyan ko ng kapahingahan.”",
      "🕊️ 1 Pedro 5:7\n“Ipagkatiwala ninyo sa kanya ang lahat ng inyong alalahanin, sapagkat siya ay nagmamalasakit sa inyo.”",
      "🕊️ Roma 10:9\n“Kung ipahahayag mo sa iyong bibig na si Hesus ay Panginoon at mananampalataya ka sa iyong puso na siya'y muling binuhay ng Diyos, ikaw ay maliligtas.”",
      "🕊️ 1 Corinto 13:4-7\n“Ang pag-ibig ay matiisin at mabait; hindi ito nananaghili, hindi ito nagmamapuri, hindi ito palalo.”",
      "🕊️ Efeso 2:8\n“Sapagkat sa pamamagitan ng biyaya kayo ay iniligtas sa pamamagitan ng pananampalataya, at ito'y hindi sa inyong sarili, ito ay kaloob ng Diyos.”",
      "🕊️ Josue 1:9\n“Huwag kang matakot o manghina, sapagkat ang Panginoon na iyong Diyos ay kasama mo saan ka man pumunta.”",
      "🕊️ Santiago 1:5\n“Kung ang sinuman sa inyo ay kulang sa karunungan, humingi siya sa Diyos, na nagbibigay sa lahat nang walang pag-aalinlangan, at ito ay ibibigay sa kanya.”"
    ];

    const verse = verses[Math.floor(Math.random() * verses.length)];
    const header = "🟢⚪🔴 𝗕𝗜𝗕𝗟𝗘 𝗩𝗘𝗥𝗦𝗘 🟢⚪🔴\n━━━━━━━━━━━━━━━━━━━━━━\n\n";
    const footer = `\n━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `Bot Developer : 𝗝𝗼𝗻𝗻𝗲𝗹 𝗦𝗼𝗿𝗶𝗮𝗻𝗼\n` +
                   `Bot Name : 𝐍𝐎𝐁𝐈𝐓𝐀 𝐀𝐈🤖`;

    api.sendMessage(header + verse + footer, event.threadID, event.messageID);
  }
};