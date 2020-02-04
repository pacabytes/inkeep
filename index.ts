import { Client, Message } from "discord.js";
import { Config, DynamoDB } from "aws-sdk";

const region = "eu-central-1";

new Config({
  credentials: {
    accessKeyId: process.env.AWS_KEY!,
    secretAccessKey: process.env.AWS_SECRET!
  },
  region
});

const ddb = new DynamoDB.DocumentClient({ region });

const client = new Client();

client.login(process.env.DISCORD_TOKEN);

client.on('ready', function () {
  console.log('Logged in as %s\n', client.user.tag);
});

client.on('message', async (message: Message) => {

  const tables = await ddb.scan({
    TableName: process.env.TABLE_NAME!
  }).promise();

  if (message.content.startsWith("!!roll")) {
    const table = tables.Items![0];
    const result = rollOnTable(table);
    message.channel.sendEmbed({
      title: "Dice Roll",
      url: "https://yamiat.com/tables/does-not-work-yet",
      description: "Roll on a table",
      thumbnail: {
        url: "https://avatarfiles.alphacoders.com/481/thumb-48172.jpg"
      },
      author: {
        name: "Yamiat",
        icon_url: client.user.avatarURL,
        url: "https://yamiat.com"
      },
      color: 3447003,
      fields: [{
        name: "Table",
        value: table.name
      }, {
        name: "Result",
        value: result!.join(" - ")
      }],
      timestamp: new Date(),
      footer: {
        icon_url: client.user.avatarURL,
        text: "© yamiat.com"
      }
    })
  }
});

function rollOnTable(table: any) {
  const roll = rollDice(table.roll);
  const result = table.results.find((res: any) => {
    return res.from <= roll && res.to >= roll;
  });

  return resolve(result.result);
}

function rollDice(roll: string) {
  const match = roll.match(/(\d?)d(\d+)/);

  const rolls = parseInt(match![1]);
  const die = parseInt(match![2]);

  let result = [];

  for (let index = 0; index < rolls; index++) {
    result.push(1 + Math.floor(Math.random() * die));
  };

  return result;
}

function resolve(result: any) {
  if (Array.isArray(result)) {
    let reward: string[] = [];
    result.forEach((block: any) => {
      const roll = rollDice(block.roll);
      const value = roll.reduce((sum, val) => sum + val, 0);
      reward.push(`${value} ${block.type} (${block.roll} ${block.type} [${roll.join(",")}])`);
    });

    return reward;
  }
}