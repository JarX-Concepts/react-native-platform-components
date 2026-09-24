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
          'MeasuringPCTabBarComponentDescriptor',
          'MeasuringPCFloatingActionButtonComponentDescriptor',
        ],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
