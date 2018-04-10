import { IDictionary } from "../generic/IDictionary";

export const Icons = {
  muted: '🔕',//'⚪',
  unmuted: '🔔', //'🔵',
  edit: '✏️', //'✏',
  delete: '❌',
  refresh: 'ℹ️'
}

interface IText {
  start: string
  help: string
  wallet_added: (address) => string,
  balance_changed: (address, balance) => string
  asset_balance_changed: (address, asset, balance) => string
  wrong_wallet: (commands) => string
  remove_wallet_question: (adderss) => string
  button_yes: string
  button_no: string
  button_ru: string
  button_en: string
  button_wallets: string
  button_birthday: string
  button_birthday_participate: string
  menu_page_title: string
  birthday_page_title: string
  birthday_page_title_already_participating: string
  birthday_message_congrats: string
  ask_wallet_promt: string
  ask_wallet_promt_invalid_input: string
  ask_email_promt: string
  ask_email_promt_invalid_input: string
  ask_email_confirmation_promt: string
  aks_email_confirmation_promt_invalid_input: string
  email_confirmation_subject: string
  email_confirmation_body: (code) => string
  language_change_question: string
  language_changed: (code) => string
  wallet_removed: string
  wallet_disabled: string
  wallet_enabled: string
  wallet_not_removed: string
  wallet_rename_description: string
  wallets_menu_header: string
  wallets_menu_no_wallets: string
  wallets_too_many_per_user: string
  wallet_renamed: (address, name) => string
  address_not_valid: string
  and_more: (amount) => string
}



export const Text: IDictionary<IText> = {
  ru: {
    start: 'Привет! Я могу уведомлять тебя об изменениях баланса по кошелькам. Пришли мне адрес waves кошелька и ты начнешь получать уведомления об изменениях баланса.',
    help: 'Я могу уведомлять тебя об изменениях баланса по кошелькам. Пришли мне адрес waves кошелька и ты начнешь получать уведомления об изменениях баланса.',
    wallet_added: (address) => `Кошелек ${address} добавлен.`,
    balance_changed: (address, balance) => `Баланс изменился ${address} -> ${balance}`,
    asset_balance_changed: (address, asset, balance) => `Баланс ${address} изменился: ${asset} -> ${balance}`,
    wrong_wallet: (commands) => `Нет никакого смысла в отправлять мне что - то помимо адреса waves кошелька, оставь это для Сири.\n\nСписок команд:\n${commands}`,
    remove_wallet_question: (adderss) => `Хочешь удалить кошелек:\n${adderss}`,
    button_yes: 'Да',
    button_no: 'Нет',
    button_ru: 'Ru',
    button_en: 'En',
    button_wallets: 'Кошельки',
    button_birthday: 'Waves 2 года!',
    button_birthday_participate: 'Участвовать!',
    menu_page_title: 'Меню',
    birthday_page_title: `

Примите участие в квесте в честь дня рождения Waves!
Кто быстрее соберет комплект из 5 токенов!

Шаги

1. Пообщайся с ботом в Twitter https://twitter.com/wavesplatform получи один из токенов *ALAN*
2. Подпишись на нашего бота в Telegram @wavesbalancebot получи один из токенов *JOHN*
3. Оставшиеся токены(*VLAD*, *ZIGM*, *YURI*) будут распространены путем  airdrop на все кошельки WAVES c 12-16 апреля.
4. Тот участник кто первый соберет комплект из 5 токенов и  сразу отправит их на указанный публичный адрес *3PG3JmVh1czUhvg8stVwFY8zXkqVJBqeeJw*

Призы: 

_1st place — 300 WAVES_
_2nd place — 250 WAVES_
_3rd place — 150 WAVES_
_4th place — 100 WAVES_
_5th place — 50 WAVES_

Напоминаем вам, для покупки недостающих токенов используйте биржу DEX —> https://wavesplatform.com/product
    
`,
    birthday_page_title_already_participating: 'Ты уже в игре! Поздравляем!',
    birthday_message_congrats: 'Поздравляем! Ты успешно зарегистрирован! Лови JOHN токен, проверь кошелек?',
    ask_wallet_promt: 'Дай адрес своего кошелька?',
    ask_wallet_promt_invalid_input: 'Адрес не похож на waves, попробуй еще:',
    ask_email_promt: 'Чтобы принять участие нам какже нужен твой email?',
    ask_email_promt_invalid_input: 'Неверный email, попробуй снова:',
    ask_email_confirmation_promt: 'Введи код, который мы выслали тебе, чтобы подтвердить почту:',
    aks_email_confirmation_promt_invalid_input: 'Неверный код, попробуй еще раз:',
    email_confirmation_subject: 'Код подтверждения wavesbot',
    email_confirmation_body: (code) => `Твой код: ${code}`,
    language_change_question: 'Меняем язык?',
    language_changed: (code) => `Язык изменен: ${code}`,
    wallet_removed: 'Кошелек удален.',
    wallet_disabled: 'Уведомления отключены.',
    wallet_enabled: 'Уведомления включены.',
    wallet_not_removed: 'Продолжаю слать уведомления.',
    wallet_rename_description: 'Задай новое имя для кошелька?',
    wallets_menu_header: 'Вот твои кошельки:',
    wallets_menu_no_wallets: 'Тут пока пусто. Отправь мне адрес waves кошелька, чтобы начать получать уведомления.',
    wallet_renamed: (address, name) => `${address}\nпереименован: ${name}`,
    wallets_too_many_per_user: 'У тебя слишком много кошельков, удали что-нибудь и сможешь добавить новый.',
    address_not_valid: 'Похоже адрес неправильный, может это не waves? Попробуй проверить и повторить ;)',
    and_more: (amount) => `\n... и ${amount} еще`
  },
  en: {
    start: `Hey! I can notify you about balance changes of your wallets. Send me a waves wallet address and I will start to notify you.`,
    help: `I can notify you about balance changes of your wallets. Send me a waves wallet address and I will start to notify you.`,
    wallet_added: (address) => `Wallet ${address} added.`,
    balance_changed: (address, balance) => `Balance changed ${address} -> ${balance}`,
    asset_balance_changed: (address, asset, balance) => `Balance ${address} changed: ${asset} -> ${balance}`,
    wrong_wallet: (commands) => `There is no point of sending me something that is not a waves wallet address, keep it for Siri.\n\nTry one of these:\n${commands}`,
    remove_wallet_question: (adderss) => `Do you want to remove:\n${adderss}`,
    button_yes: 'Yes',
    button_no: 'No',
    button_ru: 'Ru',
    button_en: 'En',
    button_wallets: 'Wallets',
    button_birthday: 'Waves 2 Years QUEST!',
    button_birthday_participate: 'Join',
    menu_page_title: 'Menu',
    birthday_page_title: `

Join Waves' 2 Years Birthday token quest! Collect all five birthday tokens and win!

*Steps of the Quest*:

1. Connect with Waves bot on our Twitter https://twitter.com/wavesplatform to receive token *ALAN*
2. Connect with Waves Telegram bot @wavesbalancebot to receive another token *JOHN*
3. Receive the rest of the tokens (*VLAD*, *ZIGM*, *YURI*) via airdrops during 12-16 April (the tokens will be airdroped to all Waves wallets out there)
4. Send all five tokens simultaneously to a special public address *3PG3JmVh1czUhvg8stVwFY8zXkqVJBqeeJw*
The five fastest users win!

Distribution of Prizes

_1st place — 300 WAVES_
_2nd place — 250 WAVES_
_3rd place — 150 WAVES_
_4th place — 100 WAVES_
_5th place — 50 WAVES_

Just a reminder: use Waves DEX if you're short of tokens —> https://wavesplatform.com/product

`,
    birthday_page_title_already_participating: 'You\'re already in the game, congrats!',
    birthday_message_congrats: 'Registration successful! Check your wallet I\'m sending JOHN token to you right now!',
    ask_wallet_promt: 'What is your wallet?',
    ask_wallet_promt_invalid_input: 'This is not valid waves address, try again...',
    ask_email_promt: 'In order to participate give us your email please?',
    ask_email_promt_invalid_input: 'Invalid email, try again:',
    ask_email_confirmation_promt: 'Confirm your email, enter the code we\'ve sent you:',
    aks_email_confirmation_promt_invalid_input: 'Invalid code, try again:',
    email_confirmation_subject: 'Confirmation code',
    email_confirmation_body: (code) => `Your code is: ${code}`,
    language_change_question: 'Choose language:',
    language_changed: (code) => `Language changed: ${code}`,
    wallet_removed: 'Wallet removed.',
    wallet_disabled: 'Notifications disabled.',
    wallet_enabled: 'Notifications enabled.',
    wallet_not_removed: 'Notifications remain enabled.',
    wallet_rename_description: 'Send me new wallet name?',
    wallets_menu_header: 'Manage your wallets:',
    wallets_menu_no_wallets: 'No wallets yet. You can send me a waves wallet address to enable notifications.',
    wallet_renamed: (address, name) => `${address}\nrenamed: ${name}`,
    wallets_too_many_per_user: 'You have too many wallets, remove old one and try again.',
    address_not_valid: 'It seems that address is not a valid one or maybe it`s not a waves wallet? Double-check everything and try again ;)',
    and_more: (amount) => `\n... and ${amount} more`
  }
}