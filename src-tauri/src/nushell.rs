use nu_engine::eval_block;
use nu_parser::parse;
use nu_protocol::{
    engine::{EngineState, Stack, StateWorkingSet},
    PipelineData, ShellError,
};

pub fn eval_nushell(
    engine_state: &mut EngineState,
    stack: &mut Stack,
    source: &[u8],
    fname: &str,
    input: PipelineData,
) -> Result<PipelineData, ShellError> {
    let (block, delta) = {
        let mut working_set = StateWorkingSet::new(engine_state);
        let (output, _) = parse(&mut working_set, Some(fname), source, false, &[]);

        (output, working_set.render())
    };

    let cwd = nu_engine::env::current_dir_str(engine_state, stack)?;

    if let Err(err) = engine_state.merge_delta(delta, Some(stack), &cwd) {
        return Err(err);
    }

    eval_block(engine_state, stack, &block, input, true, true)
}
