<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@lazi-rewards.local'],
            [
                'name' => 'Admin',
                'password' => Hash::make('LaziAdmin2024!'),
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════════╗');
        $this->command->info('║           ADMIN USER CREATED/UPDATED                     ║');
        $this->command->info('╠══════════════════════════════════════════════════════════╣');
        $this->command->info('║  URL:      /admin                                        ║');
        $this->command->info('║  Email:    admin@lazi-rewards.local                      ║');
        $this->command->info('║  Password: LaziAdmin2024!                                ║');
        $this->command->info('╚══════════════════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
