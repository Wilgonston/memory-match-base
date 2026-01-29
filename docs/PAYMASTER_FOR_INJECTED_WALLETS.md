# Paymaster Support for Injected Wallets

## Обзор

Теперь приложение поддерживает **спонсирование газа (Paymaster)** не только для Coinbase Smart Wallet, но и для **обычных кошельков** (MetaMask, Rainbow, Rabby и т.д.)!

## Как это работает?

### Автоматическое определение поддержки

Приложение автоматически определяет, поддерживает ли ваш кошелек **EIP-5792** (wallet_sendCalls):

1. **Если поддерживает** → Использует Paymaster (газ спонсируется)
2. **Если не поддерживает** → Обычная транзакция (вы платите газ)

### Какие кошельки поддерживают Paymaster?

✅ **Поддерживают (газ спонсируется):**
- Coinbase Smart Wallet
- Coinbase Wallet (с поддержкой EIP-5792)
- Некоторые версии MetaMask (с экспериментальными функциями)

❌ **Не поддерживают (вы платите газ):**
- MetaMask (стандартная версия)
- Rainbow Wallet
- Trust Wallet
- Rabby Wallet
- Другие обычные кошельки

## Технические детали

### Новый хук: `usePaymasterTransaction`

Создан универсальный хук для отправки транзакций с автоматическим определением Paymaster:

```typescript
const {
  sendTransaction,
  isPending,
  isSuccess,
  hasPaymaster, // true если Paymaster доступен
} = usePaymasterTransaction({
  address: contractAddress,
  abi: CONTRACT_ABI,
  functionName: 'update',
  args: [level, stars],
  onSuccess: (hash) => console.log('Success:', hash),
  onError: (error) => console.error('Error:', error),
});
```

### Как работает определение?

1. Хук проверяет `wallet_getCapabilities` (EIP-5792)
2. Ищет `paymasterService` в capabilities
3. Если найден → использует `wallet_sendCalls` с Paymaster
4. Если не найден → использует обычный `eth_sendTransaction`

### Код определения:

```typescript
const { data: availableCapabilities } = useCapabilities({
  account: userAddress,
});

const capabilities = useMemo(() => {
  if (!availableCapabilities) return {};
  
  const capabilitiesForChain = availableCapabilities[base.id];
  
  if (capabilitiesForChain?.['paymasterService']?.supported) {
    return {
      paymasterService: {
        url: `https://api.developer.coinbase.com/rpc/v1/base/${apiKey}`,
      },
    };
  }
  
  return {}; // Fallback to regular transaction
}, [availableCapabilities]);
```

## UI индикация

Приложение показывает пользователю, будет ли газ спонсирован:

### С Paymaster:
```
💾 Save to Blockchain
⚡ Gas-free transaction (sponsored)
```

### Без Paymaster:
```
💾 Save to Blockchain
⚡ You will pay gas for this transaction
```

## Преимущества

### Для пользователей:
- ✅ Автоматическое определение - не нужно ничего настраивать
- ✅ Бесшовный опыт - работает с любым кошельком
- ✅ Экономия газа - если кошелек поддерживает Paymaster

### Для разработчиков:
- ✅ Единый API для всех типов транзакций
- ✅ Автоматический fallback на обычные транзакции
- ✅ Простая интеграция - один хук для всего

## Примеры использования

### SaveProgressButton

```typescript
const {
  sendTransaction,
  isPending,
  isSuccess,
  hasPaymaster,
} = usePaymasterTransaction({
  address: contractAddress,
  abi: MEMORY_MATCH_PROGRESS_ABI,
  functionName: 'update',
  args: [level, stars],
  onSuccess: (hash) => {
    console.log('Transaction confirmed:', hash);
    playSound('transaction-confirmed');
  },
  onError: (error) => {
    console.error('Transaction failed:', error);
  },
});

return (
  <button onClick={sendTransaction} disabled={isPending}>
    {isPending ? 'Saving...' : 'Save to Blockchain'}
  </button>
);
```

### SaveAllProgressButton

Уже использует `useSequentialUpdateLevels`, который внутри использует `useWriteContracts` с Paymaster support.

## Ограничения

### Gas Policy

Paymaster спонсирует только транзакции к разрешенным контрактам:

```typescript
export const memoryMatchGasPolicy: GasPolicy = {
  allowedContracts: [
    '0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5', // MemoryMatchProgress
  ],
  maxGasPerTransaction: 500000n,
  maxTransactionsPerDay: 100,
};
```

### Поддержка кошельков

Не все кошельки поддерживают EIP-5792. Список будет расширяться по мере внедрения стандарта.

## Тестирование

### Как проверить, работает ли Paymaster?

1. Подключите кошелек
2. Откройте консоль браузера (F12)
3. Найдите лог:
   ```
   [usePaymasterTransaction] Paymaster service available
   ```
   или
   ```
   [usePaymasterTransaction] Paymaster service not available, using regular transaction
   ```

4. Отправьте транзакцию
5. Проверьте, был ли списан газ с вашего кошелька

### Coinbase Smart Wallet

Всегда использует Paymaster через Account Abstraction (ERC-4337).

### MetaMask / Rainbow

Обычно не поддерживают EIP-5792, поэтому будут использовать обычные транзакции.

## Будущие улучшения

- [ ] Поддержка других Paymaster провайдеров
- [ ] Кастомные gas policies для разных контрактов
- [ ] UI для выбора между Paymaster и обычной транзакцией
- [ ] Статистика использования Paymaster
- [ ] Поддержка batch transactions для injected wallets

## Заключение

Теперь приложение предоставляет **лучший возможный опыт** для всех пользователей:

- **Smart Wallet пользователи** → Всегда газ спонсируется
- **Injected wallet пользователи** → Газ спонсируется если кошелек поддерживает
- **Все остальные** → Обычные транзакции с оплатой газа

Это делает приложение **максимально доступным** и **удобным** для всех! 🎉
