import * as TelegramBot from 'node-telegram-bot-api'
import { Database } from './Database'
import { Text } from './Text'
import { WavesNotifications } from './WavesNotifications'
import * as uuid from 'uuid/v4'
import { validateAddress } from './WavesCrypto';
import { Secret } from './Secret';
import { IDictionary } from './Interfaces/IDictionary';


const db = Database()
const bot = new TelegramBot(Secret.telegrammToken, { polling: true });

interface IPageButtonResult {

}

const ClosePage: IPageButtonResult = {}
const NavigateTo: (page: () => Promise<IPage>) => IPageButtonResult = () => { return {  } }

interface IPageButton {
  text: string,
  onClick: () => Promise<IPageButtonResult>
}

interface IPage {
  title: string
  buttons: IPageButton[]
}

interface IPageContext {
}

const mainPage = async (): Promise<IPage> => {

  return {
    title: '',
    buttons: [
      { text: '', onClick: async () => NavigateTo(mainPage) }
    ]
  }
}
