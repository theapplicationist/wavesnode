import { Page, close, notify, menu, navigate, update, promt, AddButton, PageCreationCommands, IContext, updateAndNotify } from './framework'
import * as TelegramBot from 'node-telegram-bot-api'
import { KeyValueStore } from '../../generic/KeyValueStore'
import { IDictionary } from '../../generic/IDictionary'
import * as moment from 'moment'

const config = {
  dayOfTheGame: 2,
  hoursToOpenRegistration: 90
}

const kvStore = KeyValueStore('footballBot')
moment.locale('ru')

const nextGameDate = () => {
  let d = moment().day() - config.dayOfTheGame
  if (d <= 0)
    d += 7

  const prevGameDate = moment().startOf('day').subtract(d, 'days')
  return prevGameDate.add(7, 'days').add(21, 'hours').add(30, 'minutes')
}

const isRegistrationOpen = () => (nextGameDate().diff(moment()) / 1000 / 60 / 60) < config.hoursToOpenRegistration

const bot = new TelegramBot('579168769:AAEgCimzCmLq8mMM8ocJlYHJd55LMX9hhMc', { webHook: true })
bot.setWebHook('')

type Game = {
  date: string
  whoIsComing: TelegramBot.User[]
}

type BotState = {
  currentGame: Game
}

const getState = async () => {
  const createGame = () => ({
    currentGame: {
      date: nextGameDate().format('DD.MM.YYYY HH:mm'),
      whoIsComing: []
    }
  })

  let state = await kvStore.get<BotState>('state', false)
  if (!state) {
    state = {
      key: 'state',
      value: createGame()
    }
  } else {
    if (moment(state.value.currentGame.date, 'DD.MM.YYYY HH:mm').diff(moment()) < 0) {
      state.value = createGame()
    }
  }

  await kvStore.update<BotState>('state', state.value, true)

  return state
}

const updateState = async (update: (state: BotState) => BotState) => {
  const s = await getState()
  update(s.value)
  await kvStore.update<BotState>('state', s.value, true)
}

const pages = {
  game: async (_, cmd: PageCreationCommands) => {
    const s = await getState()
    const formatName = (user: TelegramBot.User) => {
      if (user.first_name && user.last_name)
        return `${user.first_name} ${user.last_name}`
      if (user.first_name && user.username)
        return `${user.first_name} (${user.username})`
      return user.first_name
    }
    const players = s.value.currentGame.whoIsComing.map(p => formatName(p)).join('\n')
    cmd.add(actions.toggle, '+1', { gameDate: s.value.currentGame.date, isGoing: true })
    cmd.add(actions.toggle, '-1', { gameDate: s.value.currentGame.date, isGoing: false })
    return `Запись на игру *${s.value.currentGame.date}*\n${players}`
  },
}

const actions = {
  toggle: async (context: IContext<{ gameDate: string, isGoing: boolean }>) => {
    const s = await getState()
    if (context.data.gameDate == s.value.currentGame.date) {
      let answer = ''
      await updateState(state => {
        if (context.data.isGoing) {
          if (state.currentGame.whoIsComing.filter(p => p.id == context.user.id).length == 0) {
            state.currentGame.whoIsComing.push(context.user)
            answer = 'Приходи!'
          }
          else answer = 'Ты уже в игре! Приходи!'
        }
        else {
          state.currentGame.whoIsComing = state.currentGame.whoIsComing.filter(p => p.id != context.user.id)
          answer = 'Обязательно приходи в следующий раз!'
        }

        return state
      })

      return updateAndNotify(answer)
    }
    else {
      return notify('Эта игра уже прошла, круто поиграли!')
    }
  },
}

const promts = {}

const { showPage } = menu(bot, pages, promts, actions, kvStore)

bot.on('message', async (msg: TelegramBot.Message) => {
  if (msg.text == '/game') {
    if (isRegistrationOpen()) {
      showPage(msg.chat.id, msg.from, pages.game)
    }
    else {
      bot.sendMessage(msg.chat.id, `Следующая игра ${nextGameDate().format('DD.MM.YYYY HH:mm')}\nзапись начнется ${nextGameDate().subtract(config.hoursToOpenRegistration, 'hours').fromNow()}\n*[тут будет кнопка]*`,
        { parse_mode: 'Markdown' })
    }
  }
})