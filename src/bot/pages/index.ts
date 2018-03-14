import { Page, close, notify, menu, navigate, update, promt, AddButton, PageCreationCommands, IContext } from './framework'
import * as TelegramBot from 'node-telegram-bot-api'
import { KeyValueStore } from '../KeyValueStore'
import { randomBytes } from 'crypto'
import { IDictionary } from '../../generic/IDictionary'

import GregorianCalendar = require('gregorian-calendar')

const getDayOfWeek = (d: Date) => {
  var date = new GregorianCalendar(require('gregorian-calendar/lib/locale/ru_RU')); // defaults to en_US 
  date.setTime(+d)
  return date.getDayOfWeek()
}

const todoListByUser: IDictionary<{ id: string, name: string }[]> = {}

const bot = new TelegramBot('537693032:AAGCOljwslLYSGjTpgaD6GoeGwUYnvyRVak', { polling: true });

const commands = {
  newGame: {
    aiases: ['/newGame'],

  }
}


const pages = {
  main: async (_, cmd: PageCreationCommands) => {
    cmd.add(actions.toTasks, 'Tasks')
    return "Main Page"
  },
  tasks: async (context, cmd: PageCreationCommands) => {
    const list = todoListByUser[context.user.id]
    if (list) {
      list.forEach(e => {
        cmd
          .add(actions.toTaskDetails, e.name, { id: e.id, name: e.name })
      });
    }
    cmd
      .lineBreak()
      .add(actions.addNewTask, 'Add')
    return "Taks"
  },
  taskDetails: async (context: IContext<{ id, name }>, cmd: PageCreationCommands) => {
    cmd.add(actions.deleteTask, 'Delete', context.data.id)
    cmd.add(actions.toTasks, 'Back')
    return context.data.name
  }
}

const actions = {
  toTaskDetails: async (context: IContext<{ id, name }>) => navigate(pages.taskDetails, context.data),
  deleteTask: async (context: IContext<string>) => {
    todoListByUser[context.user.id] = todoListByUser[context.user.id].filter(x => x.id != context.data)
    return navigate(pages.tasks)
  },
  toTasks: async () => navigate(pages.tasks),
  someAction: async (context: IContext<{ id, name }>) => {
    console.log(context.data)
    return {}
  },
  close: async () => close,
  addNewTask: async () => promt(promts.newTask, 'Name?')
}

const promts = {
  newTask: async (user: TelegramBot.User, data: any, reply: string) => {
    let list: any[] = todoListByUser[user.id]
    if (!list) {
      list = []
      todoListByUser[user.id] = list
    }
    list.push({ id: randomBytes(10).toString('base64'), name: reply })
    return notify(`${reply} added`)
  }
}

const encodeDecode = {
  encode: (obj: any): string => Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64'),
  decode: (value: string): any => JSON.parse(Buffer.from(value, 'base64').toString('utf-8'))
}

const kvStore = KeyValueStore('testStore', encodeDecode)

const { showPage } = menu(bot, pages, promts, actions, kvStore, encodeDecode)

type Player = {}
type Game = {
  message: TelegramBot.Message
  started: Date
  whoIsComing: Player[]
}

type BotState = {
  game?: Game
}

const BotState = async () => {
  const s = await kvStore.get<BotState>("state")
  if (s) return s
  return {}
}

const createGameOrUseExisting = (game?: Game): Game => {
  if (game) {

  } else {
    const now = new Date()
    //now getDayOfWeek(now)
    return {

    }
  }
}

bot.on('message', async (msg: TelegramBot.Message) => {
  if (msg.text = "/newgame") {
    const s = await BotState()

    if (s.game) {
      bot.deleteMessage(s.game.message.chat.id, s.game.message.message_id.toString())
      if (getDayOfWeek(s.game.started) > 4) {

      }
      //if (s.game.started)
    }
    const m = await showPage(msg.chat.id, msg.from, pages.main)

  }
})