import { PageFactory, close, notify, menu, navigate, update } from './framework'
import * as TelegramBot from 'node-telegram-bot-api'


let a = 1
const bot = new TelegramBot('', { polling: true });

const page1: PageFactory = async (pageContext) => ({
  text: 'Menu',
  buttons: ({ 'Page2': async () => navigate(page2), 'Exit': async () => close })
})

const page2: PageFactory = async (pageContext) => ({
  text: `Sub menu: ${a}`,
  buttons: ({
    'Back': async () => {
      console.log('back clicked')
      return [navigate(page1), notify('going back')]
    },
    '+': async () => {
      a++
      return update
    },
    '1': {
      text: `${a}`,
      action: async () => {
        a++
        return update
      }
    }
  })
})

const { showPage } = menu(bot, { page1, page2 })

bot.on('message', (msg: TelegramBot.Message) => {
  bot.sendMessage(msg.chat.id, 't', { reply_markup: { force_reply: true } })
  //showPage(msg.chat.id, msg.from, page1)
})

