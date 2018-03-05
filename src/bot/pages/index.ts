import { Page, close, notify, menu, navigate, update, promt, AddButton } from './framework'
import * as TelegramBot from 'node-telegram-bot-api'
import { KeyValueStore } from '../KeyValueStore';
import { randomBytes } from 'crypto';

const todoListByUser = {}

const bot = new TelegramBot('537693032:AAGCOljwslLYSGjTpgaD6GoeGwUYnvyRVak', { polling: true });

const mainPage: Page = async (pageContext, addButton: AddButton) => {
  addButton(actions.toTasks, 'Tasks')
  return "Main Page"
}

const tasksPage: Page = async (pageContext, addButton) => {
  const list = todoListByUser[pageContext.user.id]
  if (list) {
    list.forEach(e => {
      addButton(actions.toTaskDetails, e.name, e.id)
    });
  }
  addButton(actions.addNewTask, 'Add')
  return "Taks"
}

const actions = {
  toTaskDetails: async (context, id: string) => close,
  toTasks: async () => navigate(tasksPage),
  someAction: async (context, data: { id, name }) => {
    console.log(data)
    return {}
  },
  close: async () => close,
  addNewTask: async () => promt(newTaskPromt, 'Name?')
}

const newTaskPromt = async (user: TelegramBot.User, data: any, reply: string) => {

  let list: any[] = todoListByUser[user.id]
  if (!list) {
    list = []
    todoListByUser[user.id] = list
  }

  list.push({ id: randomBytes(10).toString('base64'), name: reply })


  return update
}

const encodeDecode = {
  encode: (obj: any): string => Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64'),
  decode: (value: string): any => JSON.parse(Buffer.from(value, 'base64').toString('utf-8'))
}

const kvStore = KeyValueStore('testStore', encodeDecode)

const { showPage } = menu(bot, { mainPage, tasksPage }, { newTaskPromt }, actions, kvStore, encodeDecode)

bot.on('message', (msg: TelegramBot.Message) => {
  //bot.sendMessage(msg.chat.id, 't', { reply_markup: { force_reply: true } })
  if (!msg.reply_to_message)
    showPage(msg.chat.id, msg.from, mainPage)
})