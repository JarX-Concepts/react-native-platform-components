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
        ],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
