import {
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Identity,
  Avatar,
  Name,
  Address,
  EthBalance,
} from '@coinbase/onchainkit/identity';

export function WalletComponents() {
  return (
    <>
      <ConnectWallet />
      <WalletDropdown>
        <Identity hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
          <EthBalance />
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </>
  );
}
