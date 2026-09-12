import React, { useSyncExternalStore } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AlertButton, AlertOptions } from 'react-native';

type Notice = { title: string; message?: string; buttons: AlertButton[]; options?: AlertOptions };
let notices: Notice[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const getSnapshot = () => notices;

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
    notices = [...notices, { title, message, buttons: buttons?.length ? buttons : [{ text: '확인' }], options }];
    notify();
  },
};

export function AlertHost() {
  const [notice] = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!notice) return null;

  const close = (button?: AlertButton) => {
    notices = notices.slice(1);
    notify();
    button?.onPress?.();
  };
  const dismiss = () => {
    const cancel = notice.buttons.find((button) => button.style === 'cancel');
    if (cancel) close(cancel);
    else if (notice.options?.cancelable) {
      close();
      notice.options.onDismiss?.();
    }
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={styles.title}>{notice.title}</Text>
          {!!notice.message && <Text style={styles.message}>{notice.message}</Text>}
          <View style={styles.actions}>
            {notice.buttons.map((button, index) => (
              <Pressable key={index} accessibilityRole="button" style={styles.button} onPress={() => close(button)}>
                <Text style={[styles.buttonText, button.style === 'destructive' && styles.destructive]}>{button.text ?? '확인'}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 18, padding: 24, gap: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2933' },
  message: { fontSize: 15, lineHeight: 24, color: '#4B5563' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6' },
  buttonText: { color: '#008A9A', fontWeight: '700' },
  destructive: { color: '#DC2626' },
});
