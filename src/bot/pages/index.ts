import { Page, close, notify, menu, navigate, update, promt } from './framework'
import * as TelegramBot from 'node-telegram-bot-api'
import { KeyValueStore } from '../KeyValueStore';

const todoListByUser = {}

const bot = new TelegramBot('537693032:AAGCOljwslLYSGjTpgaD6GoeGwUYnvyRVak', { polling: true });

const mainPage: Page = async (pageContext, addButton) => {
  addButton(actions.navigate, 'To Page')
  return "Main Page"
}

const secondPage: Page = async (pageContext, addButton) => {
  addButton<{ id, name }>(actions.someAction, 'foo', { id: 1, name: 'adf' })
  addButton(actions.close, 'close')
  return "Second"
}

const actions = {
  navigate: async () => navigate(secondPage),
  someAction: async (context, data: {id, name}) => { 
    console.log(data)
    return {} 
  },
  close: async () => close,
  addNewTask: async () => promt(newTaskPromt, 'Name?')
}

const newTaskPromt = (user: TelegramBot.User, data: any, reply: string) => {
  todoListByUser[user.id] = [{ id: '', name: reply }]
}

const encodeDecode = {
  encode: (obj: any): string => Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64'),
  decode: (value: string): any => JSON.parse(Buffer.from(value, 'base64').toString('utf-8'))
}

const kvStore = KeyValueStore('testStore', encodeDecode)

const { showPage } = menu(bot, { mainPage, secondPage }, { newTaskPromt }, actions, kvStore, encodeDecode)

bot.on('message', (msg: TelegramBot.Message) => {
  //bot.sendMessage(msg.chat.id, 't', { reply_markup: { force_reply: true } })
  showPage(msg.chat.id, msg.from, mainPage)
})

