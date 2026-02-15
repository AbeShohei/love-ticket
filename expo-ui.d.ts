
declare module '@expo/ui/swift-ui' {
    import React from 'react';
    import { ViewProps } from 'react-native';

    export type DateTimePickerProps = {
        initialDate?: string | null;
        onDateSelected?: (date: Date) => void;
        displayedComponents?: 'date' | 'hourAndMinute' | 'dateAndTime';
        variant?: 'compact' | 'wheel' | 'graphical';
        [key: string]: any;
    } & ViewProps;

    export const DateTimePicker: React.FC<DateTimePickerProps>;

    export const Host: React.FC<React.PropsWithChildren<{ matchContents?: boolean } & ViewProps>>;
}

declare module '@expo/ui/jetpack-compose' {
    import React from 'react';
    import { ViewProps } from 'react-native';

    export type DateTimePickerProps = {
        initialDate?: string | null;
        onDateSelected?: (date: Date) => void;
        displayedComponents?: 'date' | 'hourAndMinute' | 'dateAndTime';
        [key: string]: any;
    } & ViewProps;

    export const DateTimePicker: React.FC<DateTimePickerProps>;
}
