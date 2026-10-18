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
          'MeasuringPCNavigationRailComponentDescriptor',
          'MeasuringPCFloatingActionButtonComponentDescriptor',
          'MeasuringPCChipComponentDescriptor',
          'MeasuringPCChipGroupComponentDescriptor',
        ],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
