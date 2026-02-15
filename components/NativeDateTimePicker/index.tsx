import RNDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  mode?: 'date' | 'time' | 'datetime';
  value: Date;
  onChange: (date: Date) => void;
  style?: any;
  title?: string;
}

export function NativeDateTimePicker({ mode = 'datetime', value, onChange, style, title }: Props) {
  const [show, setShow] = useState(false);
  const [tempValue, setTempValue] = useState(value); // For iOS internal state before "Done"

  const handleAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setShow(false);
    if (date) {
      onChange(date);
    }
  };

  const handleIOSChange = (event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setTempValue(date);
    }
  };

  const confirmIOS = () => {
    onChange(tempValue);
    setShow(false);
  };

  const cancelIOS = () => {
    setTempValue(value); // Reset to original
    setShow(false);
  };

  // Format value for display
  const displayValue = mode === 'time'
    ? value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    : value.toLocaleDateString();

  // WEB Implementation
  if (Platform.OS === 'web') {
    const inputType = mode === 'date' ? 'date' : mode === 'time' ? 'time' : 'datetime-local';
    return (
      <View style={[styles.container, style]}>
        {title && <Text style={styles.label}>{title}</Text>}
        <TextInput
          value={
            mode === 'time'
              ? value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
              : value.toISOString().split('T')[0]
          }
          onChange={(e: any) => {
            const targetValue = e.nativeEvent.text || e.target.value;
            const d = new Date(value);
            if (mode === 'time') {
              const [h, m] = targetValue.split(':');
              if (h && m) d.setHours(parseInt(h, 10), parseInt(m, 10));
            } else {
              const newDate = new Date(targetValue);
              if (!isNaN(newDate.getTime())) {
                d.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
              }
            }
            onChange(d);
          }}
          style={styles.webInput}
          // @ts-ignore
          type={inputType}
        />
      </View>
    );
  }

  // iOS Implementation
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, style]}>
        {title && <Text style={styles.label}>{title}</Text>}
        <TouchableOpacity style={styles.displayButton} onPress={() => { setTempValue(value); setShow(true); }}>
          <Text style={styles.displayText}>{displayValue}</Text>
        </TouchableOpacity>

        <Modal
          visible={show}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={cancelIOS}>
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmIOS}>
                  <Text style={styles.doneButtonText}>完了</Text>
                </TouchableOpacity>
              </View>
              <RNDateTimePicker
                mode={mode}
                value={tempValue}
                onChange={handleIOSChange}
                display="spinner"
                style={{ width: '100%', height: 200 }}
                themeVariant="light"
                textColor="black"
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Android Implementation
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.container, style]}>
        {title && <Text style={styles.label}>{title}</Text>}
        <TouchableOpacity style={styles.displayButton} onPress={() => setShow(true)}>
          <Text style={styles.displayText}>{displayValue}</Text>
        </TouchableOpacity>

        {show && (
          <RNDateTimePicker
            mode={mode}
            value={value}
            onChange={handleAndroidChange}
            display="default" // Default is dialog on Android
          />
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  webInput: {
    padding: 10,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    width: '100%',
  },
  displayButton: {
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  displayText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center', // Ensure text is centered
    width: '100%', // Ensure text takes full width of button for centering
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    paddingBottom: 20, // Safe area
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center', // Fix: Force picker to center
    width: '100%', // Ensure modalContent takes full width
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: '100%', // Fix: Ensure header takes full width for space-between
  },
  doneButtonText: {
    fontSize: 16,
    color: '#007AFF', // iOS Blue
    fontWeight: '600',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF3B30', // iOS Red
  },
});
