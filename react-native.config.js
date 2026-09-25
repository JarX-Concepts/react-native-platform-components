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
        ],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
