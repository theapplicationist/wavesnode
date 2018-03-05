import * as TelegramBot from 'node-telegram-bot-api'
import { Message, User, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { IDictionary } from '../../generic/IDictionary';

const J = {
  encode: (obj: any): string => Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64'),
  decode: (value: string): any => JSON.parse(Buffer.from(value, 'base64').toString('utf-8'))
}

type InlineButton = () => Promise<IButtonResult | IButtonResult[]>
interface Button {
  text: string,
  action: InlineButton
}

interface IPage {
  text: string,
  buttons: IDictionary<InlineButton | Button>
}

interface IPageContext {
  user: User
}

interface IButtonResult {
  navigate?: string
  close?: boolean
  notify?: string
  update?: boolean
}

export const close: IButtonResult = { close: true }
export const update: IButtonResult = { update: true }
export const notify = (notify: string): IButtonResult => ({ notify })
export const navigate = (page: PageFactory): IButtonResult => ({ navigate: page.name })


export type PageFactory = (context: IPageContext) => Promise<IPage>

export const menu = (bot: TelegramBot, pages: IDictionary<PageFactory>) => {

  const getPage = (pageId: string) => pages[pageId]

  bot.on('callback_query', async (callback_query: CallbackQuery) => {
    const d = J.decode(callback_query.data)
    const context = { user: callback_query.from }
    const page = await getPage(d.pageId)(context)

    const button = page.buttons[d.button]
    const { buttonAction, buttonText } = (<Button>button).action ? { buttonText: (<Button>button).text, buttonAction: (<Button>button).action } : { buttonText: d.button, buttonAction: <InlineButton>button }
    const r = await buttonAction()

    const buttonResult: IButtonResult[] = !(<[any]>r).length ? [<IButtonResult>r] : <IButtonResult[]>r

    let answer = ''

    buttonResult.forEach(result => {
      if (result.close) {
        bot.deleteMessage(callback_query.message.chat.id, callback_query.message.message_id.toString())
      }
      if (result.navigate) {
        updatePage(bot, callback_query.message, callback_query.from, result.navigate)
      }
      if (result.update) {
        updatePage(bot, callback_query.message, callback_query.from, d.pageId)
      }
      if (result.notify) {
        answer = result.notify
      }
    })

    bot.answerCallbackQuery({ callback_query_id: callback_query.id, text: answer })
  })

  const prepareReplyMarkup = (pageId: string, page: IPage): InlineKeyboardMarkup => (
    {
      inline_keyboard: [
        Object.keys(page.buttons).map((buttonId: string): InlineKeyboardButton => {
          const button = page.buttons[buttonId]
          const { buttonAction, buttonText } = (<Button>button).action ? { buttonText: (<Button>button).text, buttonAction: (<Button>button).action } : { buttonText: buttonId, buttonAction: button }

          const callback_data = {
            pageId,
            button: buttonId
          }

          return {
            text: buttonText,
            callback_data: J.encode(callback_data)
          }
        }
        )
      ]
    }
  )

  const updatePage = async (bot: TelegramBot, message: Message, user: User, pageId: string) => {
    const p = await getPage(pageId)({ user })

    const r = prepareReplyMarkup(pageId, p)

    bot.editMessageText(p.text, { chat_id: message.chat.id, message_id: message.message_id, reply_markup: r })
  }

  const showPage = async (chatId: string | number, user: User, page: PageFactory) => {
    const pageId = page.name
    const p = await page({ user })
    const r = prepareReplyMarkup(pageId, p)

    bot.sendMessage(chatId, p.text, { reply_markup: r })
  }

  return { showPage }
}
