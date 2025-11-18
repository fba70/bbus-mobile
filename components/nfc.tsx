import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import NfcProxy from '@/lib/nfcProxy';
import React, { useEffect, useState } from 'react';
import { Alert, Button } from 'react-native';
import NfcManager, { NfcEvents, TagEvent } from 'react-native-nfc-manager';

function renderNfcNotEnabled(setEnabled: Function) {
    return (
      <ThemedView>
        <ThemedText style={{textAlign: 'center', marginBottom: 10}}>
          Your NFC is not enabled. Please first enable it and hit CHECK AGAIN button
        </ThemedText>

        <Button
          onPress={() => NfcProxy.goToNfcSetting()}
          title='GO TO NFC SETTINGS'
          />

        <Button
          onPress={async () => {
            setEnabled(await NfcProxy.isEnabled());
          }}
          title='CHECK AGAIN'
          />  
      </ThemedView>
    );
}

function renderNfcScreen() {
    return (
      <ThemedView>
        <ThemedText>приложите пропуск</ThemedText>
      </ThemedView>
    );
}

export default function Nfc(props: { onNfcScanned: (arg0: TagEvent | null) => void; }) {
    const [supported, setSupported] = useState(false);
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        async function initNfc() {
            try {
                const success = await NfcProxy.init();
                console.log("1", success);
                setSupported(success);
                setEnabled(await NfcProxy.isEnabled());

                if (success) {
                    function onBackgroundTag(bgTag: TagEvent | null) {
                        console.log(bgTag);
                        props.onNfcScanned(bgTag);
                    }

                    // get the initial launching tag
                    const bgTag = await NfcManager.getBackgroundTag();
                    onBackgroundTag(bgTag);

                    // listen to other background tags after the app launched
                    NfcManager.setEventListener(
                        NfcEvents.DiscoverBackgroundTag,
                        onBackgroundTag,
                    );
                }
            } catch (ex: any) {
                console.log(ex);
                Alert.alert('ERROR', 'fail to init NFC', [{text: 'OK'}]);
            }
        }

        initNfc();
    }, [props]);

    return (<ThemedView>
                {!supported && <ThemedText>No NFC on this device</ThemedText>}
                {supported && !enabled && renderNfcNotEnabled(setEnabled)}
                {supported && enabled && renderNfcScreen()}
            </ThemedView>);
}