import Nfc from '@/components/nfc';
import QrCamera from '@/components/qrCamera';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import 'react-native-reanimated';

export default function Authentication(props: any) {
    console.log(props.route);
    /*
        routes[0].organization.name
        routes[0].routeName
        JSON.parse(routes[0].organization?.metadata).logo
    */
    return <ThemedView>
                <QrCamera onQrScanned={(data) => console.log(data)} />
                <Nfc onNfcScanned={(data) => console.log(data)} />
            </ThemedView>;
}