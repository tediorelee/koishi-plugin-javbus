import { Context, segment } from 'koishi'
import Schema from 'schemastery'


export const name = 'javbus'

export interface Config {
  apiPrefix: string;
  allowDownloadLink: boolean;
  allowPreviewCover: boolean;
}

export const Config = Schema.object({
  description: Schema.string().default('这里不用填写东西').description('该插件请低调使用, 请勿配置于QQ或者是其他国内APP平台, 带来的后果请自行承担'),
  apiPrefix: Schema.string().default('').required().description('请填写你的api地址前缀'),
  allowDownloadLink: Schema.boolean().default(false).description('是否允许返回磁力链接'),
  allowPreviewCover: Schema.boolean().default(false).description('是否允许返回封面预览(包含NSFW内容, 请酌情选择需不需要开启该配置项)')
})

export const movieDetailApi = '/api/v1/movies/';
export const starDetailApi = '/api/v1/stars/';

export function apply(ctx: Context, config: Config) {
  async function fetchMovieDetail(id: string) {
    return await ctx.http.get(config.apiPrefix + movieDetailApi  + id);
  };

  async function fetchStarDetail(id: string) {
    return await ctx.http.get(config.apiPrefix + starDetailApi  + id);
  };

  ctx.command('jav <id:text>', '查找javbus番号')
    .action(async ({session}, id) => {
      try {
        if (!id) return '请提供番号!'
        const result = await fetchMovieDetail(id)
        const {
          title,
          img,
          magnets,
          date,
          publisher,
          stars
        } = result;
        const coverImg = await ctx.http.get<ArrayBuffer>(img, {
          responseType: 'arraybuffer',
        });
        const publisherName = publisher?.name;
        const starsArray = stars.map(star => star.name);
        const starString = starsArray.length > 1 ? starsArray.join(', ') : starsArray[0];
        const magnetsWithSubtitle = magnets.filter(item => item.hasSubtitle);
        const magnetsMaxBytes = magnetsWithSubtitle && magnetsWithSubtitle.length ? magnetsWithSubtitle.find(m => Math.max(m.numberSize)) : magnets.find(m => Math.max(m.numberSize));

        if (!config.allowDownloadLink && !config.allowPreviewCover) {
          await session.sendQueued(`标题: ${title}\n发行日期: ${date}\n女优: ${starString}\n发行商: ${publisherName}`)
        } else if (config.allowDownloadLink && !config.allowPreviewCover) {
          await session.sendQueued(`标题: ${title}\n发行日期: ${date}\n女优: ${starString}\n发行商: ${publisherName}\n磁力: ${magnetsMaxBytes.link}`)
        } else if (!config.allowDownloadLink && config.allowPreviewCover) {
          await session.sendQueued(`标题: ${title}\n发行日期: ${date}\n女优: ${starString}\n发行商: ${publisherName}\n${segment.image(coverImg)}`)
        } else {
          console.log('123')
          await session.sendQueued(`标题: ${title}\n发行日期: ${date}\n女优: ${starString}\n发行商: ${publisherName}\n磁力: ${magnetsMaxBytes.link}${segment.image(coverImg)}`)
        }
      } catch(err) {
        console.log(err);
        return `发生错误!请检查发送的番号是否正确;  ${err}`;
      }
    });
}
