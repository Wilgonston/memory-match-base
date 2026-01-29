# Account Abstraction Transactions

## Почему транзакции не отображаются на BaseScan?

Когда вы используете **Smart Wallet** (Coinbase Smart Wallet) с **Paymaster** для покрытия газа, ваши транзакции проходят через **ERC-4337 Account Abstraction**.

### Что это значит?

1. **Обычные транзакции** (EOA - Externally Owned Account):
   - Отправляются напрямую с вашего кошелька
   - Отображаются в обычном списке транзакций на BaseScan
   - Вы платите газ напрямую

2. **Account Abstraction транзакции** (Smart Wallet):
   - Отправляются через **Bundler** (например, Coinbase Bundler)
   - Проходят через **EntryPoint** контракт
   - Называются **UserOperations** (не transactions)
   - Газ может быть оплачен **Paymaster** (спонсором)
   - Отображаются в специальном разделе BaseScan

## Где найти ваши транзакции?

### Вариант 1: BaseScan - Account Abstraction раздел
https://basescan.org/txsAA

Здесь отображаются все UserOperations на Base.

### Вариант 2: JiffyScan (рекомендуется)
https://jiffyscan.xyz/

JiffyScan - это специализированный эксплорер для Account Abstraction транзакций. Он показывает:
- UserOperation hash
- Bundler информацию
- Paymaster данные (кто оплатил газ)
- Детали выполнения

**Ссылка на вашу транзакцию:**
```
https://jiffyscan.xyz/userOpHash/{HASH}?network=base
```

## Как проверить транзакцию в приложении?

После успешного сохранения прогресса:

1. Откройте консоль браузера (F12)
2. Найдите логи:
   ```
   [SaveAllProgressButton] ✅ Transaction confirmed on blockchain
   [SaveAllProgressButton] Transaction ID: 0x...
   [SaveAllProgressButton] View on JiffyScan: https://jiffyscan.xyz/userOpHash/0x...
   ```
3. Перейдите по ссылке JiffyScan

## Почему это лучше?

**Преимущества Account Abstraction:**
- ✅ Газ оплачивается спонсором (Paymaster)
- ✅ Не нужно иметь ETH для транзакций
- ✅ Batch транзакции (несколько операций в одной)
- ✅ Более гибкая логика авторизации
- ✅ Лучший UX для пользователей

**Недостатки:**
- ❌ Транзакции не отображаются в обычном списке BaseScan
- ❌ Нужно использовать специальные эксплореры (JiffyScan)
- ❌ Немного сложнее отследить

## Технические детали

### Ваш контракт прогресса:
```
0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5
```

### Ваш Smart Wallet адрес:
```
skywhywalker.base.eth
0xAb24862fc70dfAa91d67Fc465C2be8Cae2e9fe02
```

### Bundler:
```
Coinbase: Bundler
```

### EntryPoint:
```
Entry Point 0.6.0
```

## Как работает процесс?

1. Вы нажимаете "Save to Blockchain"
2. Приложение создает **UserOperation**
3. UserOperation отправляется в **Bundler**
4. Bundler проверяет с **Paymaster** (оплатит ли он газ)
5. Paymaster одобряет (если транзакция соответствует политике)
6. Bundler отправляет UserOperation в **EntryPoint** контракт
7. EntryPoint выполняет вашу транзакцию
8. Ваш прогресс сохраняется в контракте `MemoryMatchProgress`

## Проверка прогресса

Вы можете проверить сохраненный прогресс напрямую через контракт:

1. Откройте контракт на BaseScan:
   https://basescan.org/address/0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5#readContract

2. Используйте функции:
   - `getTotal(address)` - общее количество звезд
   - `getStars(address, level)` - звезды для конкретного уровня
   - `getUpdated(address)` - время последнего обновления

3. Введите ваш адрес: `0xAb24862fc70dfAa91d67Fc465C2be8Cae2e9fe02`

## Заключение

Ваши транзакции **успешно проходят** и **сохраняются на блокчейне**! Они просто отображаются в другом месте из-за использования Account Abstraction.

Используйте **JiffyScan** для просмотра деталей транзакций или проверяйте прогресс напрямую через контракт.
