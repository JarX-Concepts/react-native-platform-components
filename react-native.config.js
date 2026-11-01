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
          'MeasuringPCSwitchComponentDescriptor',
          'MeasuringPCCheckboxComponentDescriptor',
          'MeasuringPCRadioGroupComponentDescriptor',
        ],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
