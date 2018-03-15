import { IDictionary } from "../generic/IDictionary";

export const Icons = {
  muted: '🔕',//'⚪',
  unmuted: '🔔', //'🔵',
  edit: '✏️', //'✏',
  delete: '❌',
  refresh: 'ℹ️'
}

export const Text = {
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