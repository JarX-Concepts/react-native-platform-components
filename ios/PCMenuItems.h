// PCMenuItems.h
//
// Bridges flattened menu items (src/menuItems.ts) from their codegen structs
// to the dictionaries PCMenuItem (PCMenuSupport.swift) reads. Codegen makes a
// struct per component and prop, so these are templates over any struct with
// the menu item fields.

#pragma once

#import <Foundation/Foundation.h>

#include <string>
#include <vector>

namespace platformcomponents {

inline NSString *PCMenuString(const std::string &value) {
  return value.empty() ? @"" : [NSString stringWithUTF8String:value.c_str()];
}

template <typename Item>
NSDictionary *PCMenuItemToDictionary(const Item &item) {
  return @{
    @"id" : PCMenuString(item.id),
    @"title" : PCMenuString(item.title),
    @"subtitle" : PCMenuString(item.subtitle),
    @"parent" : @(item.parent),
    @"kind" : PCMenuString(item.kind),
    @"iconType" : PCMenuString(item.iconType),
    @"iconName" : PCMenuString(item.iconName),
    @"iconRequest" : PCMenuString(item.iconRequest),
    @"iconUri" : PCMenuString(item.iconUri),
    @"iconScale" : @(item.iconScale),
    @"iconTinted" : PCMenuString(item.iconTinted),
    @"imageColor" : PCMenuString(item.imageColor),
    @"destructive" : PCMenuString(item.destructive),
    @"disabled" : PCMenuString(item.disabled),
    @"keepsMenuPresented" : PCMenuString(item.keepsMenuPresented),
    @"state" : PCMenuString(item.state),
    @"haptics" : PCMenuString(item.haptics),
  };
}

template <typename Item>
NSArray<NSDictionary *> *PCMenuItemsToArray(const std::vector<Item> &items) {
  NSMutableArray<NSDictionary *> *array = [NSMutableArray arrayWithCapacity:items.size()];
  for (const auto &item : items) {
    [array addObject:PCMenuItemToDictionary(item)];
  }
  return array;
}

template <typename Item>
bool PCMenuItemEqual(const Item &a, const Item &b) {
  return a.id == b.id && a.title == b.title && a.subtitle == b.subtitle &&
      a.parent == b.parent && a.kind == b.kind && a.iconType == b.iconType &&
      a.iconName == b.iconName && a.iconRequest == b.iconRequest && a.iconUri == b.iconUri &&
      a.iconScale == b.iconScale && a.iconTinted == b.iconTinted &&
      a.imageColor == b.imageColor && a.destructive == b.destructive &&
      a.disabled == b.disabled &&
      a.keepsMenuPresented == b.keepsMenuPresented && a.state == b.state &&
      a.haptics == b.haptics;
}

/// Compares every field, so a changed title or state (a stepper or toggle
/// in an open menu) reaches native.
template <typename Item>
bool PCMenuItemsEqual(const std::vector<Item> &a, const std::vector<Item> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    if (!PCMenuItemEqual(a[i], b[i])) return false;
  }
  return true;
}

} // namespace platformcomponents
