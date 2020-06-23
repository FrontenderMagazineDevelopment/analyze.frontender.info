import dotenv from 'dotenv';
import amqp from 'amqplib';
import ArticleBuilder from '@frontender-magazine/builder';

dotenv.config();

const { RABIITMQ_HOST, PORT = 3000 } = process.env;
let channel;
let connection;

(async () => {
  try {  
    // connecting to the rebbitmq bus
    connection = await amqp.connect(`amqp://${RABIITMQ_HOST}`);
    channel = await connection.createChannel();
    const queue = 'bus';
    channel.assertQueue(queue, {
      durable: false
    });
    channel.consume(queue, async (msg) => {
      console.log('msg: ');
      console.log(JSON.parse(msg.content.toString()));
      const event = JSON.parse(msg.content.toString());

      if (event.name === "ARTICLE_LINKS") {
        let index = event.payload.length;
        while(index--) {
          const link = event.payload[index];
          const builder = new ArticleBuilder();
          builder.skip.stages = [
            'github:before',
            'github',
            'github:after',
          ];
          builder.skip.plugins = [
            { name: 'codepenTransform' },
            { name: 'codepenTransformIFrame' },
            { name: 'createREADME' },
            { name: 'downloadImages' },
            { name: 'writeMarkdown' },
            { name: 'TMPDir' },
            { name: 'initGithub' },
            { name: 'uploadToRepo' },
            { name: 'createRepo' },
            { name: 'createREADME' },
            { name: 'createCard' },
          ];
          try {
            const result = await builder.create(link);
            const description = (
              (result.schema && result.schema.description) || 
              (result.openGraph && result.openGraph.ogDescription) || 
              null
            );
            const author = (
                  result.mercury && 
                  result.mercury.length > 0 && 
                  result.mercury[0].author && 
                  result.mercury[0].author.replace(/[\r\n]+/gm, '').trim()
                ) || 
                (result.schema && result.schema.author);
            const article = {
              url: link,
              domain: result.domain,
              author: author && [author],
              tags: result.tags,
              title:
                (result.schema && result.schema.title) ||
                (result.mercury && result.mercury.length > 0 && result.mercury[0].title) ||
                (result.openGraph && result.openGraph.ogTitle),
              description: description && description.replace(/[\r\n]+/gm, '').trim(),
              lang:
                (result.openGraph && result.openGraph.ogLocale) || 
                result.language && result.language.length>0 && result.language[0].isReliable && result.language[0].language || 
                'en',
              published:
                (result.openGraph && result.openGraph.article && result.openGraph.article.published_time) ||
                (result.mercury && result.mercury.length > 0 && result.mercury[0].date_published) ||
                (result.openGraph && result.openGraph.article && result.openGraph.article.modified_time) ||
                (result.schema && result.schema.modified),
              updated:
                (result.openGraph && result.openGraph.article && result.openGraph.article.modified_time) ||
                (result.mercury && result.mercury.length > 0 && result.mercury[0].date_published) ||
                (result.schema && result.schema.modified),
            };
            console.log(article);
            const msg = JSON.stringify({
              name: "CREATE_ARTICLE",
              payload: article,
            });
            await channel.sendToQueue(queue, Buffer.from(msg));
            console.log(" [x] Sent %s", msg);
          } catch (error) {
            console.log(error);
          }
        }
      }

    }, {
        noAck: true
    });
  } catch (error) {
    console.log(error);
    // shutting down rabbitmq connection
    if (channel) await channel.close();
    if (connection) await connection.close();
    process.exit(1);
  }
})();
