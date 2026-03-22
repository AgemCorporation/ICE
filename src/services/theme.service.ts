import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // False = Light Mode (Default), True = Dark Mode
  isDark = signal<boolean>(false);

  constructor() {
    // 1. Check LocalStorage
    const storedTheme = localStorage.getItem('theme');
    
    // 2. Check System Preference if no storage
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme) {
      this.isDark.set(storedTheme === 'dark');
    } else {
      // Default to Light as requested, or use system preference if desired
      // strict request: "Default is Light"
      this.isDark.set(false); 
    }

    // 3. Effect to apply class to HTML tag
    effect(() => {
      const isDark = this.isDark();
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  toggle() {
    this.isDark.update(v => !v);
  }

  setDark(value: boolean) {
    this.isDark.set(value);
  }
}