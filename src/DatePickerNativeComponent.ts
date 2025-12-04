// DatePickerNativeComponent.ts
import type { CodegenTypes, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

type DateChangeEvent = {
  timestamp: CodegenTypes.Double;
};

type IOSProps = {};

type AndroidProps = {};

type WebProps = {};

type WindowsProps = {};

type MacOSProps = {};

type CommonProps = {
  date?: CodegenTypes.Double;
  minimumDate?: CodegenTypes.Double;
  maximumDate?: CodegenTypes.Double;
  mode?: string;
  locale?: string;
  timeZoneName?: string;
  //onChange?: CodegenTypes.BubblingEventHandler<DateChangeEvent> | null;
};

export interface NativeProps extends ViewProps, CommonProps {
  ios?: IOSProps;
  android?: AndroidProps;
  web?: WebProps;
  windows?: WindowsProps;
  macos?: MacOSProps;

  onChange?: CodegenTypes.BubblingEventHandler<DateChangeEvent> | null;
}

export default codegenNativeComponent<NativeProps>('DatePicker');
