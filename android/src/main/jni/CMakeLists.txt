# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Custom CMakeLists.txt that extends the codegen with custom shadow node code

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# Get the codegen-generated sources
set(PC_CODEGEN_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../build/generated/source/codegen/jni")

# Codegen sources
file(GLOB react_codegen_SRCS CONFIGURE_DEPENDS
    ${PC_CODEGEN_DIR}/*.cpp
    ${PC_CODEGEN_DIR}/react/renderer/components/PlatformComponentsViewSpec/*.cpp
)

# Custom shadow node sources
file(GLOB_RECURSE LIB_CUSTOM_SRCS CONFIGURE_DEPENDS
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../shared/*.cpp
)

add_library(
    react_codegen_PlatformComponentsViewSpec
    OBJECT
    ${react_codegen_SRCS}
    ${LIB_CUSTOM_SRCS}
)

# IMPORTANT: Put shared directory FIRST so our custom headers shadow the codegen ones
target_include_directories(react_codegen_PlatformComponentsViewSpec
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/../../../../shared
        ${PC_CODEGEN_DIR}
        ${PC_CODEGEN_DIR}/react/renderer/components/PlatformComponentsViewSpec
)

target_link_libraries(
    react_codegen_PlatformComponentsViewSpec
    fbjni
    jsi
    reactnative
)

target_compile_reactnative_options(react_codegen_PlatformComponentsViewSpec PRIVATE)
