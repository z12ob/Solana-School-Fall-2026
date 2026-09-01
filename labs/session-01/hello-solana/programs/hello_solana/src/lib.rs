use anchor_lang::prelude::*;

declare_id!("DCSKdvKJoYpD7pKoKsQvMy6HcDkb2Z8eBPdvUqtuEJ4G");

#[program]
pub mod hello_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
