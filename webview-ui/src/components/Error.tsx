interface ErrorProps {
    errors: string[];
}
function Error({ errors }: ErrorProps) {
    return (
        <main className="flex flex-column justify-start padding-20">
            <h2 className="danger">Error: Loading Failed</h2>
            <p>Failed to load the prompt, please fix the content manually and try again.</p>
            {errors.map((error) => (
                <pre key={`${error}`} className="bg-danger padding-20">
                    {error}
                </pre>
            ))}
        </main>
    );
}

export default Error;
