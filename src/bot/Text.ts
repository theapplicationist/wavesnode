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
    button_birthday_participate: 'Да, конечно!',
    menu_page_title: 'Меню',
    birthday_page_title: 'Waves празднует свой второй день рождения и мы подготовили что-то особенное...',
    birthday_page_title_already_participating: 'Ты уже в игре! Поздравляем!',
    birthday_message_congrats: 'Поздравляем! Ты успешно зарегистрирован!',
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
    button_birthday: 'Join Waves 2 Years Birthday quest!',
    button_birthday_participate: 'Join',
    menu_page_title: 'Menu',
    birthday_page_title: `Waves will be celebrating it\'s second birthday soon, and we have prepared something special for you!\nCollect all six birthday tokens and win!\nSteps of the Quest\nConnect with Waves bot on Facebook [link] to receive a token\nConnect with Waves bot on Twitter [link] to receive the next token\nConnect with Waves Telegram bot [link] to receive another token\nReceive the rest of the tokens via airdrops (the tokens will de deployed to all Waves wallets out there\nSend all six tokens simultaneously to a special public address 3PG3JmVh1czUhvg8stVwFY8zXkqVJBqeeJw\nThe four fastest users win!\nDistribution of Prizes:\n1st place — 300 WAVES\n2nd place — 250 WAVES\n3rd place — 150 WAVES\n4th place — 100 WAVES)\n5th place — 50 WAVES\nJust a reminder: use Waves DEX if you're short of tokens!`,
    birthday_page_title_already_participating: 'You\'re already in the game, congrats!',
    birthday_message_congrats: 'Registration successful!',
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
    address_not_valid: 'It seems that address is not a valid one or maybe it`s not a waves wallet? Double-check everything and try again ;)',
    and_more: (amount) => `\n... and ${amount} more`
  }
}