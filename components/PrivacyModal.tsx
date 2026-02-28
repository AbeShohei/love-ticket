import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    Linking,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

type Props = {
    visible: boolean;
    onClose: () => void;
};

export function PrivacyModal({ visible, onClose }: Props) {
    const { t } = useTranslation();

    const handleDeleteRequest = () => {
        Alert.alert(
            t('privacy.deleteRequestTitle'),
            t('privacy.deleteRequestMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('privacy.sendEmail'),
                    onPress: () =>
                        Linking.openURL(
                            `mailto:support@love-ticket.app?subject=${encodeURIComponent(t('privacy.deleteRequestSubject'))}&body=${encodeURIComponent(t('privacy.deleteRequestBody'))}`
                        ),
                },
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('privacy.title')}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('privacy.policySection')}</Text>
                        <TouchableOpacity
                            style={styles.linkRow}
                            onPress={() =>
                                Linking.openURL('https://love-ticket.app/privacy')
                            }
                        >
                            <Ionicons name="document-text-outline" size={20} color="#666" />
                            <Text style={styles.linkText}>{t('privacy.viewPrivacyPolicy')}</Text>
                            <Ionicons name="open-outline" size={18} color="#ccc" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.linkRow}
                            onPress={() =>
                                Linking.openURL('https://love-ticket.app/terms')
                            }
                        >
                            <Ionicons name="reader-outline" size={20} color="#666" />
                            <Text style={styles.linkText}>{t('privacy.viewTerms')}</Text>
                            <Ionicons name="open-outline" size={18} color="#ccc" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('privacy.visibilitySection')}</Text>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                {t('privacy.visibilityInfo')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('privacy.dataManagementSection')}</Text>
                        <TouchableOpacity
                            style={styles.deleteRow}
                            onPress={handleDeleteRequest}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF4B4B" />
                            <Text style={styles.deleteText}>{t('privacy.requestDataDeletion')}</Text>
                        </TouchableOpacity>
                        <Text style={styles.hint}>
                            {t('privacy.deletionHint')}
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fbfcfd' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
    closeBtn: { position: 'absolute', right: 16 },
    content: { flex: 1, padding: 20 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#999', marginBottom: 12, textTransform: 'uppercase' },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    linkText: { flex: 1, fontSize: 16, color: '#333' },
    infoBox: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
    },
    infoText: { fontSize: 14, color: '#666', lineHeight: 22 },
    deleteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 10,
    },
    deleteText: { fontSize: 16, color: '#FF4B4B', fontWeight: '500' },
    hint: { fontSize: 13, color: '#999', marginTop: 8, lineHeight: 18 },
});
