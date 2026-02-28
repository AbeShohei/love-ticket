import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useState } from 'react';
import {
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

export function HelpSupportModal({ visible, onClose }: Props) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const { t } = useTranslation();

    const FAQ_ITEMS = [
        {
            question: t('help.faqPairingQuestion'),
            answer: t('help.faqPairingAnswer'),
        },
        {
            question: t('help.faqProposalQuestion'),
            answer: t('help.faqProposalAnswer'),
        },
        {
            question: t('help.faqNotificationQuestion'),
            answer: t('help.faqNotificationAnswer'),
        },
        {
            question: t('help.faqDeleteQuestion'),
            answer: t('help.faqDeleteAnswer'),
        },
        {
            question: t('help.faqPremiumQuestion'),
            answer: t('help.faqPremiumAnswer'),
        },
    ];

    const toggleFaq = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
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
                    <Text style={styles.headerTitle}>{t('help.title')}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('help.faqSection')}</Text>
                        {FAQ_ITEMS.map((item, index) => (
                            <View key={index} style={styles.faqItem}>
                                <TouchableOpacity
                                    style={styles.faqQuestion}
                                    onPress={() => toggleFaq(index)}
                                >
                                    <Text style={styles.faqQuestionText}>{item.question}</Text>
                                    <Ionicons
                                        name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                                        size={20}
                                        color="#999"
                                    />
                                </TouchableOpacity>
                                {expandedIndex === index && (
                                    <View style={styles.faqAnswer}>
                                        <Text style={styles.faqAnswerText}>{item.answer}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('help.contactSection')}</Text>
                        <TouchableOpacity
                            style={styles.linkRow}
                            onPress={() =>
                                Linking.openURL(
                                    `mailto:support@love-ticket.app?subject=${encodeURIComponent(t('help.contactSubject'))}`
                                )
                            }
                        >
                            <Ionicons name="mail-outline" size={20} color="#666" />
                            <Text style={styles.linkText}>{t('help.contactEmail')}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('help.appInfoSection')}</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{t('help.version')}</Text>
                            <Text style={styles.infoValue}>{appVersion}</Text>
                        </View>
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
    faqItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    faqQuestionText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#333', marginRight: 8 },
    faqAnswer: {
        paddingBottom: 14,
    },
    faqAnswerText: { fontSize: 14, color: '#666', lineHeight: 22 },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 10,
    },
    linkText: { flex: 1, fontSize: 16, color: '#333' },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    infoLabel: { fontSize: 16, color: '#333' },
    infoValue: { fontSize: 16, color: '#999' },
});
