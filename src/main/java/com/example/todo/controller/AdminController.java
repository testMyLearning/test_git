package com.example.todo.controller;

import com.example.todo.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')") // Все методы требуют роль ADMIN
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        // Здесь можно добавить статистику и т.д.
        model.addAttribute("pageTitle", "Панель администратора");
        return "pages/admin/dashboard";
    }

    @GetMapping("/users")
    public String listUsers(Model model) {
        // Получаем всех пользователей
        model.addAttribute("users", userService.getAll());
        model.addAttribute("pageTitle", "Управление пользователями");
        return "pages/admin/users";
    }

    @PostMapping("/users/{userId}/toggle-status")
    public String toggleUserStatus(@PathVariable Long userId) {
        // Здесь можно добавить логику блокировки/разблокировки пользователя
        return "redirect:pages/admin/users";
    }

    @PostMapping("/users/{userId}/make-admin")
    public String makeAdmin(@PathVariable Long userId) {
        // Логика назначения роли ADMIN
        return "redirect:pages/admin/users";
    }
}