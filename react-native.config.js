module.exports = {
  dependency: {
    platforms: {
      android: {
        componentDescriptors: [
          'MeasuringPCSelectionMenuComponentDescriptor',
          'MeasuringPCDatePickerComponentDescriptor',
          'MeasuringPCSegmentedControlComponentDescriptor',
          'MeasuringPCButtonComponentDescriptor',
          'MeasuringPCButtonGroupComponentDescriptor',
          'MeasuringPCTextFieldComponentDescriptor',
        ],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
