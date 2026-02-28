import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/providers/I18nProvider';
import { LanguageCode } from '@/i18n';

type Props = {
    visible: boolean;
    onClose: () => void;
};

export function LanguageSettingsModal({ visible, onClose }: Props) {
    const { t } = useTranslation();
    const { language, setLanguage, supportedLanguages, isLoading } = useI18n();
    const [changing, setChanging] = useState<LanguageCode | null>(null);

    const handleLanguageChange = async (lang: LanguageCode) => {
        if (lang === language) return;

        setChanging(lang);
        try {
            await setLanguage(lang);
        } catch (error) {
            console.error('Failed to change language:', error);
        } finally {
            setChanging(null);
        }
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
                    <Text style={styles.headerTitle}>{t('language.title')}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={styles.sectionTitle}>{t('language.selectLanguage')}</Text>

                    {isLoading ? (
                        <ActivityIndicator size="large" color="#FF4B4B" style={styles.loader} />
                    ) : (
                        <View style={styles.optionsContainer}>
                            {supportedLanguages.map((lang) => {
                                const isSelected = language === lang.code;
                                const isChanging = changing === lang.code;

                                return (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[
                                            styles.optionButton,
                                            isSelected && styles.optionButtonSelected,
                                        ]}
                                        onPress={() => handleLanguageChange(lang.code)}
                                        disabled={isChanging || changing !== null}
                                    >
                                        <View style={styles.optionContent}>
                                            <Text style={[
                                                styles.optionName,
                                                isSelected && styles.optionNameSelected,
                                            ]}>
                                                {lang.name}
                                            </Text>
                                            <Text style={styles.optionNativeName}>
                                                {lang.nativeName}
                                            </Text>
                                        </View>

                                        <View style={styles.optionRight}>
                                            {isChanging ? (
                                                <ActivityIndicator size="small" color="#FF4B4B" />
                                            ) : isSelected ? (
                                                <Ionicons name="checkmark-circle" size={24} color="#FF4B4B" />
                                            ) : (
                                                <View style={styles.emptyCircle} />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fbfcfd',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
    },
    closeBtn: {
        position: 'absolute',
        right: 16,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    loader: {
        marginTop: 40,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    optionButtonSelected: {
        borderColor: '#FF4B4B',
        backgroundColor: 'rgba(255, 75, 75, 0.05)',
    },
    optionContent: {
        flex: 1,
    },
    optionName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    optionNameSelected: {
        color: '#FF4B4B',
    },
    optionNativeName: {
        fontSize: 14,
        color: '#999',
        marginTop: 2,
    },
    optionRight: {
        marginLeft: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#ddd',
    },
});
